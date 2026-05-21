import { ChakraLoader } from "@/components/ChakraLoader";

export default function Loading() {
  return (
    <div className="container-page flex min-h-[45vh] items-center justify-center py-12">
      <ChakraLoader />
    </div>
  );
}
