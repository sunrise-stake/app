import { Trees } from "@/partials/trees";

export default function TreePage({ params }) {
  const { address } = params

  return (
    <Trees address={address} />
  )
}
