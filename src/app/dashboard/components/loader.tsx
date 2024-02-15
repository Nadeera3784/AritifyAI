import { Player } from '@lottiefiles/react-lottie-player';

const Loader = () => {
    return (
        <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <Player
            autoplay
            loop
            src="https://lottie.host/b0d59e69-33ca-479e-8f1a-f0956b57338d/AIOA97O7iJ.json"
            style={{ height: '300px', width: '300px' }}
          >
          </Player>
          <h3 className="mt-4 text-lg font-semibold">Please wait...</h3>
        </div>
      </div>
    );
  }
  export default Loader;