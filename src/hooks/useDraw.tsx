import { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

export const useDraw = (brushRadius: number) => {
  const [canvasStates, setCanvasStates] = useState<ImageData[]>([]);
  const [mouseDown, setMouseDown] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevPoint = useRef<null | Point>(null);

  const onMouseDown = () => setMouseDown(true);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setZoomLevel(1);
  };

  const drawLine = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      currentPoint: Point,
      prevPoint: Point | null
    ) => {
      const { x: currX, y: currY } = currentPoint;
      const lineColor = "rgba(255,70,70,1)";
      const lineWidth = brushRadius;

      const startPoint = prevPoint ?? currentPoint;
      ctx.beginPath();
      ctx.lineWidth = lineWidth * 2;
      ctx.strokeStyle = lineColor;
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(currX, currY);
      ctx.stroke();

      ctx.fillStyle = lineColor;
      ctx.beginPath();
      ctx.arc(startPoint.x, startPoint.y, brushRadius, 0, 365);
      ctx.fill();
    },
    [brushRadius]
  );

  const adjustPointForZoom = (point: Point): Point => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas is not initialized');
    const rect = canvas.getBoundingClientRect();
    return {
      x: (point.x - rect.left) / zoomLevel,
      y: (point.y - rect.top) / zoomLevel,
    };
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!mouseDown) return;
      const rawPoint: Point = { x: e.clientX, y: e.clientY };
      const currentPoint = adjustPointForZoom(rawPoint);

      const ctx = canvasRef.current?.getContext('2d', {willReadFrequently: true});
      if (!ctx || !currentPoint) return;

      if (!prevPoint.current) {
        const canvasState = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        setCanvasStates((prevState) => [...prevState, canvasState]);
      }

      drawLine(ctx, currentPoint, prevPoint.current);
      prevPoint.current = currentPoint;
    };

    const mouseUpHandler = () => {
      setMouseDown(false);
      prevPoint.current = null;
    };

    const currentCanvas = canvasRef.current;
    currentCanvas?.addEventListener('mousemove', handler);
    window.addEventListener('mouseup', mouseUpHandler);
    return () => {
      currentCanvas?.removeEventListener('mousemove', handler);
      window.removeEventListener('mouseup', mouseUpHandler);
    };
  }, [mouseDown, drawLine, zoomLevel]);

  

  /** Handle undoing last line */
  const undo = useCallback(() => {
    if (canvasStates.length === 0) return;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const lastState = canvasStates[canvasStates.length - 1];
    ctx.putImageData(lastState, 0, 0);
    setCanvasStates((prevState) => prevState.slice(0, -1));
  }, [canvasStates]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "z" && e.metaKey) undo();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo]);

  const [isCursorVisible, setIsCursorVisible] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // if mouse is outside of image, don't update cursor position
      if (!canvasRef.current) return;
      const { x, y } = canvasRef.current.getBoundingClientRect();
      if (
        e.clientX < x + brushRadius ||
        e.clientX > x + canvasRef.current.width - brushRadius ||
        e.clientY < y + brushRadius ||
        e.clientY > y + canvasRef.current.height - brushRadius
      )
        return setIsCursorVisible(false);
      setIsCursorVisible(true);

      setCursorPosition({ x: e.clientX - x, y: e.clientY - y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [brushRadius]);

  function getMaskImage(width: number, height: number) {
    // Create an off-screen canvas with the same dimensions as the original image
    const offScreenCanvas = document.createElement("canvas");
    offScreenCanvas.width = width;
    offScreenCanvas.height = height;
    const offScreenCtx = offScreenCanvas.getContext("2d")!;

    // Draw the on-screen canvas content onto the off-screen canvas, scaling it to match the original image dimensions
    offScreenCtx.drawImage(canvasRef.current!, 0, 0, width, height);

    // Get image data from the off-screen canvas
    const imageData = offScreenCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];

      if (alpha !== 0) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      } else {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
      }
    }

    offScreenCtx.putImageData(imageData, 0, 0);

    return offScreenCanvas.toDataURL("image/png", 1.0);
  }


  const zoomIn = () => {
    setZoomLevel(zoomLevel * 1.1);
    applyZoom();
  };

  const zoomOut = () => {
    setZoomLevel(zoomLevel / 1.1);
    applyZoom();
  };

  const applyZoom = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) throw new Error('Canvas context is not initialized');
    ctx.setTransform(zoomLevel, 0, 0, zoomLevel, 0, 0);
  };

  return {
    canvasRef,
    cursorPosition,
    isCursorVisible,
    onMouseDown,
    clear,
    undo,
    getMaskImage,
    zoomIn,
    zoomOut
  };
};