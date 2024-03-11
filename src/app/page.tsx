import Image from "next/image";
import SphereView from "@/components/sphere";

const Home = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex justify-items-center">
        {/* <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left"> */}
        <SphereView
          className="flex justify-center h-full w-full"
          bits={5}
          values={[
            [0, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 0, 0, 0],
            [1, 1, 1, 0, 0],
            [1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1],
          ]}
        />
      </div>
    </main>
  );
};

export default Home;
