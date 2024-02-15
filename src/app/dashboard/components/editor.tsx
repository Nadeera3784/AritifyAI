"use client"
import { useEffect, useState, useCallback, useRef, FormEvent, MouseEvent } from 'react'
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Forward,
  Reply,
  Download,
  LucideRotateCcw,
  FileImage,
  MousePointerSquare,
  Loader2,
  ClipboardType
} from "lucide-react"
import UploadArea from './upload-area'
import { CustomPrompt } from "./custom-promt"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { useRemoveBackground } from "../../../hooks/useRemoveBackground"
import Loader from "./loader"
import { useDraw } from "../../../hooks/useDraw"
import { bufferToBase64 } from "../../../lib/utils"

const Editor = () => {

  const apiKey: string = process.env.NEXT_PUBLIC_CLIPDROP_KEY || "";

  const [file, setFile] = useState<File | undefined>(undefined)
  const [previousImageDataURL, setPreviousImageDataURL] = useState<string | null>(null)
  const [currentImageSource, setCurrentImageSource] = useState<string | null>(null)
  const [tab, setTab] = useState<string>('background-remove');
  const [brushRadius, setBrushRadius] = useState(25);
  const { toast } = useToast();
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { removeBackground, loading, error, dataURL } = useRemoveBackground();
  const {
    canvasRef,
    isCursorVisible,
    cursorPosition,
    onMouseDown,
    clear,
    getMaskImage,
  } = useDraw(brushRadius);

  const [visibilityCustomPromt, setVisibilityCustomPromt] = useState(false);
  const customPromptRef = useRef<HTMLTextAreaElement>(null);

  const reset = useCallback(() => {
    setPreviousImageDataURL(null);
    setCurrentImageSource(null);
    setFile(undefined);
    if (customPromptRef.current) {
      customPromptRef.current.value = '';
    }
  }, [])

  useEffect(() => {
    if (!file) {
      return
    }
    const imageDataURL = URL.createObjectURL(file);
    setPreviousImageDataURL(imageDataURL);
    setImageLoaded(true);
    if (tab == 'background-remove') {
      removeBackground(file, apiKey).then(() => {
        setCurrentImageSource(dataURL);
      }).catch((e) => {
        toast({
          title: "Uh oh! Something went wrong.",
          description: "Please try again later",
        })
        reset();
      });
    }
  }, [file])


  const onTabChange = (tab: string) => {
    setTab(tab);
    if (tab === 'textToImage') {
      setVisibilityCustomPromt(true);
    }
  }

  const onClickCleanUp = async () => {
    setGenerating(true);
    const img = imageRef.current;
    if (!img) return;
    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;
    const originalImage = img.src;
    const maskImage = getMaskImage(originalWidth, originalHeight);
    const originalImageBlob = await (await fetch(originalImage)).blob();
    const maskImageBlob = await (await fetch(maskImage)).blob();
    const originalImageExtension =
      originalImageBlob.type === "image/jpeg" ? "jpg" : "png";
    const formData = new FormData();
    formData.append(
      "image_file",
      originalImageBlob,
      `image.${originalImageExtension}`
    );
    formData.append("mask_file", maskImageBlob, "mask.png");

    try {

      const headers: Record<string, string> = {
        'user-agent': 'ClipDrop-BatchProcess',
      }
      headers['x-api-key'] = apiKey;
      const response = await fetch('https://clipdrop-api.co/cleanup/v1', {
        method: 'POST',
        headers,
        body: formData,
      })

      if (response.status && response.status > 400) {
        const text = await response.text()
        throw new Error(response.status + ' ' + text)
      }
      const buffer = await response.arrayBuffer();
      const dataURL = bufferToBase64(buffer);
      setPreviousImageDataURL(dataURL);
      setGenerating(false);
      clear();
    } catch (error) {
      console.error(error);
    } finally {
      setGenerating(false);
    }
  }

  const  onClickGenerate = async  () => {
    setGenerating(true);
    if(customPromptRef.current){
        const form = new FormData()
        form.append('prompt', customPromptRef.current.value)
    
        try {
          const response = await fetch('https://clipdrop-api.co/text-to-image/v1', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey
            },
            body: form,
          });
          const buffer = await response.arrayBuffer();
          const dataURL = bufferToBase64(buffer);
          setPreviousImageDataURL(dataURL);
          setGenerating(true);
        } catch (error) {
          setGenerating(false);
          console.error(error);
        } finally {
          setGenerating(false);
        }
    }
  }

  return (
    <div className="h-full flex-col md:flex">
      <div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
        <h2 className="text-lg font-semibold">ArtifyAI</h2>
        <div className="ml-auto flex w-full space-x-2 sm:justify-end">
          <Button variant="outline" size="icon">
            <Reply className="h-4 w-4" />
            <span className="sr-only">Undo</span>
          </Button>
          <Button variant="outline" size="icon">
            <Forward className="h-4 w-4" />
            <span className="sr-only">Redo</span>
          </Button>
          {file &&
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
          }
          <Button variant="outline">Share</Button>
        </div>
      </div>
      <Separator />
      <Tabs defaultValue="background-remove" className="flex-1" onValueChange={(event) => onTabChange(event)}>
        <div className="container h-full py-6">
          <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_200px]">
            <div className="flex-col space-y-4 sm:flex md:order-2">
              <div className="grid gap-2">
                <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Mode
                </span>
                <TabsList className="grid grid-cols-3">

                  <TabsTrigger value="background-remove">
                    <span className="sr-only">Background remove</span>
                    <FileImage className="h-5 w-5" />
                  </TabsTrigger>

                  <TabsTrigger value="cleanup">
                    <span className="sr-only">Cleanup</span>
                    <MousePointerSquare className="h-5 w-5" />
                  </TabsTrigger>

                  <TabsTrigger value="textToImage">
                    <span className="sr-only">TextToImage</span>
                    <ClipboardType className="h-5 w-5" />
                  </TabsTrigger>


                </TabsList>
              </div>
              <CustomPrompt visibility={visibilityCustomPromt}  customPromptRef={customPromptRef}/>
            </div>
            <div className="md:order-1">
              <TabsContent value="background-remove" className="mt-0 border-0 p-0">
                <div className="flex h-full flex-col space-y-4">

                  {!file &&
                    <div className="grid h-full grid-rows-2 gap-6 lg:grid-cols-1 lg:grid-rows-1">
                      <UploadArea file={file} setFile={setFile} apiKey={apiKey} />
                    </div>
                  }

                  {loading &&
                    <Loader />
                  }

                  {dataURL && previousImageDataURL &&
                    <ReactCompareSlider
                      itemOne={<ReactCompareSliderImage src={dataURL} srcSet={dataURL} alt="Image one" />}
                      itemTwo={<ReactCompareSliderImage src={previousImageDataURL} srcSet={previousImageDataURL} alt="Image two" />}
                    />
                  }
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" disabled={loading} onClick={() => reset()}>
                      <span className="sr-only">Clear</span>
                      <LucideRotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cleanup" className="mt-0 border-0 p-0">
                <div className="flex h-full flex-col space-y-4">
                  {!file &&
                    <div className="grid h-full grid-rows-2 gap-6 lg:grid-cols-1 lg:grid-rows-1">
                      <UploadArea file={file} setFile={setFile} apiKey={apiKey} />
                    </div>
                  }
                  <div className="relative cursor-none">

                    {previousImageDataURL &&
                      <img
                        src={previousImageDataURL}
                        alt="to clean up"
                        className="w-[600px]"
                        ref={imageRef}
                      />
                    }

                    {isCursorVisible &&
                      <div
                        className="rounded-full bg-red-500 absolute opacity-70"
                        style={{
                          left: cursorPosition.x,
                          top: cursorPosition.y,
                          width: brushRadius * 2,
                          height: brushRadius * 2,
                          marginLeft: -brushRadius,
                          marginTop: -brushRadius,
                        }}
                      >
                      </div>
                    }

                    {imageLoaded && (
                      <canvas
                        ref={canvasRef}
                        onMouseDown={onMouseDown}
                        width={imageRef?.current?.width}
                        height={imageRef?.current?.height}
                        className={" absolute top-0 left-0 opacity-70"}
                      />
                    )}

                  </div>
                  <div className="flex items-center space-x-2">
                    <Button disabled={generating} onClick={() => onClickCleanUp()}>
                      {generating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Clean Up
                    </Button>
                    <Button variant="outline" onClick={() => reset()}>
                      <span className="sr-only">reset</span>
                      <LucideRotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="textToImage" className="mt-0 border-0 p-0">
                <div className="flex h-full flex-col space-y-4">

                  {generating &&
                    <Loader />
                  }

                  {!previousImageDataURL &&
                    <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
                      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          className="h-10 w-10 text-muted-foreground"
                          viewBox="0 0 24 24"
                        >
                          <circle cx={12} cy={11} r={1} />
                          <path d="M11 17a1 1 0 0 1 2 0c0 .5-.34 3-.5 4.5a.5.5 0 0 1-1 0c-.16-1.5-.5-4-.5-4.5ZM8 14a5 5 0 1 1 8 0" />
                          <path d="M17 18.5a9 9 0 1 0-10 0" />
                        </svg>
                        <h3 className="mt-4 text-lg font-semibold">Text to Image Generations</h3>
                        <p className="mb-4 mt-2 text-sm text-muted-foreground">
                          Start generating your AI image
                        </p>
                      </div>
                    </div>
                  }

                  <div className="relative cursor-none">
                    {previousImageDataURL &&
                      <img
                        src={previousImageDataURL}
                        alt="to clean up"
                        className="w-full"
                      />
                    }
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button disabled={generating} onClick={() => onClickGenerate()}>
                      {generating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Generate
                    </Button>
                    <Button variant="outline" onClick={() => reset()}>
                      <span className="sr-only">reset</span>
                      <LucideRotateCcw className="h-4 w-4" />
                    </Button>
                  </div>

                </div>
              </TabsContent>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
export default Editor;