import { useCallback, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import DropZone from './drop-zone'
import {
    PlusCircle
  } from "lucide-react"

const ALLOWED_FILES = ['image/png', 'image/jpeg']

interface PageProps {
  file: File | undefined
  setFile: (file: File | undefined) => void
  apiKey: string | undefined
}


export default function UploadArea({ file, setFile, apiKey }: PageProps) {
  const inputFileRef = useRef<HTMLInputElement | null>(null)

  const handleFilesSelected = useCallback((files: FileList | Array<File>) => {
    const file = Array.from(files).filter((file) =>
      ALLOWED_FILES.includes(file.type)
    )[0]

    if (file) {
      setFile(file)
    }
    if (inputFileRef.current) {
      inputFileRef.current.value = ''
    }
  }, [])

  const [dragging, setDragging] = useState(false)
  const handleDragging = useCallback((dragging: boolean) => {
    setDragging(dragging)
  }, [])

  return (
    <div className="px-2">
      <div
        className={twMerge(
          'w-full h-full min-h-[300px] lg:min-h-[700px] xl:min-h-[700px]',
          'rounded-md border-2 border-dashed bg-muted items-center justify-center',
          !apiKey ? 'pointer-events-none opacity-10' : ''
        )}
      >
        <DropZone
          onDrop={(files) => handleFilesSelected(files)}
          onDrag={handleDragging}
        >
          <div
            className={twMerge(
              'flex',
              'flex-col items-center justify-center',
              'px-8 py-8 text-center sm:py-16',
              'cursor-pointer',
              'hover:bg-gray-100',
              dragging ? 'opacity-50' : ''
            )}
            onClick={() => inputFileRef.current?.click()}
          >
            <div>
               <PlusCircle className='w-32 h-32'/>
            </div>
            <p className="text-center font-bold opacity-100 text-3xl mt-3">
              {apiKey
                ? 'Drop Your Image Here'
                : 'Set your API key to get started'}
            </p>
            <input
              type="file"
              ref={inputFileRef}
              className={twMerge(
                'absolute top-0 bottom-0 left-0 right-0',
                'hidden'
              )}
              accept={ALLOWED_FILES.join(',')}
              onChange={(ev) =>
                handleFilesSelected(ev.currentTarget.files ?? [])
              }
            />
          </div>
        </DropZone>
      </div>
    </div>
  )
}