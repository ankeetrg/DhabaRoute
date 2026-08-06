import type { Metadata } from "next";
import { getAllDhabas } from "@/lib/dhabas";
import { ClaimListingDirectory } from "@/components/ClaimListingDirectory";

export const metadata: Metadata = {
  title: "Claim a Listing",
  description:
    "Find your dhaba on DhabaRoute and claim it to keep hours, menu, and photos accurate.",
};

export default function ClaimListingPage() {
  return <ClaimListingDirectory dhabas={getAllDhabas()} />;
}
