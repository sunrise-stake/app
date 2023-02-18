'use client';

import { Transition } from '@headlessui/react'
import { AccountSearch } from './account-search'

const Brandmark = () => {
  return (
    <Transition className="text-center" unmount={false} appear={true} show={true}>
      <Transition.Child
        as="h1"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        enter="transition-opacity duration-1000 delay-1000"
      >
        <img src="/logo.png" alt="Sunrise Stake" className="inline" />
      </Transition.Child>
      <Transition.Child
        as="h2"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        enter="transition-opacity duration-1000 delay-2000"
      >
        <img src="/trees.png" alt="trees." className="inline" />
      </Transition.Child>
      <Transition.Child
        enterFrom="translate-y-8"
        enterTo="translate-y-0"
        enter="transition-transform duration-500 delay-3000"
      >
        <Transition.Child
          enterFrom="opacity-0"
          enterTo="opacity-100"
          enter="transition-opacity transform duration-500 delay-3000"
        >
          <AccountSearch />
        </Transition.Child>
      </Transition.Child>
    </Transition>
  )
}

export {
  Brandmark,
}