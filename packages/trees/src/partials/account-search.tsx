'use client';

import { isBase58 } from "@/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

function AccountSearch() {
  const router = useRouter()

  const [error, setError] = useState(null)
  const [address, setAddress] = useState('')

  const handleSubmit = (ev) => {
    ev.preventDefault()
    setError(null)

    if (isBase58(address)) router.push(`/${address}`)
    else setError('Invalid address')
  }

  return (
    <form className="my-2" onSubmit={handleSubmit}>
      <input
        // autoFocus
        className="p-2 border-2 border-emerald-300"
        placeholder="Solana address"
        value={address}
        onChange={(ev) => setAddress(ev.target.value)}
      />
      <button
        type="submit"
        className="ml-1 p-3 rounded bg-emerald-600"
      >
        Go
      </button>
      {error ? (<div className="text-red-500">{error}</div>) : null}
    </form>
  )
}

export {
  AccountSearch,
}
