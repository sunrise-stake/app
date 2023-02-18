'use client';

import { fetcher } from '@/helper'
import { toShortBase58 } from '@/utils'
import { Transition } from '@headlessui/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react'
import { FiArrowLeftCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import useSWR from 'swr'

function Trees({ address }) {
  const { data: _data } = useSWR(`/api/account/${address}`, fetcher)
  const containerRef =  useRef(null)
  const treeImgRef = useRef(null)

  const [data, updateData] = useState(null)
  const [index, updateIndex] = useState(0)
  const [show, updateShow] = useState(false)

  useEffect(() => {
    updateData(_data)
  }, [_data])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: index * containerRef.current.getBoundingClientRect().width,
        top: 0,
        behavior: 'smooth',
      })
    }
  }, [index])

  const handleNavClick = (step: number) => {
    if (!(index + step < 0 || index + step > Object.keys(data.neighbors).length)) updateIndex(index + step)
  }
  
  // Wait for tree image to complete loading before showing, otherwise animations won't run
  useEffect(() => {
    let iid = setInterval(() => {
      if (treeImgRef.current && treeImgRef.current.complete) {
        updateShow(true)
        clearInterval(iid)
      }
    }, 250)
  }, [])

  return (
    <div className="fixed w-full h-full">
      {data ? (
        <Transition
          // appear={true}
          show={show}
          unmount={false}
          enterFrom="blur-2xl"
          enterTo="blur-none"
          enter="transition duration-3000"
        >
          <ul className="relative w-full h-full overflow-hidden" ref={containerRef}>
            <li className="w-full h-full flex flex-col justify-center items-center">
              <img className="max-w-full FloatingTree" src="/tree.png" ref={treeImgRef} />
              <div>{toShortBase58(address)}</div>
            </li>
            {Object.keys(data.neighbors).map((key, n) => (
              <li
                key={key}
                className={`absolute top-0 w-full h-full flex flex-col justify-center items-center`}
                style={{ left: `${(n + 1) * 100}%` }}
              >
                <img className="max-w-full FloatingTree" src="/tree.png" />
                <div>{toShortBase58(key)}</div>
              </li>
            ))}
          </ul>
        </Transition>
      ) : null}
      <div className="absolute top-0 left-0 h-full flex items-center">
        <button
          className="rounded-r-lg bg-emerald-600 text-white disabled:opacity-50"
          disabled={index === 0}
          onClick={() => handleNavClick(-1)}
        >
          <FiChevronLeft size={80} className="stroke-white" />
        </button>
      </div>
      <div className="absolute top-0 right-0 h-full flex items-center">
        <button
          className="rounded-l-lg bg-emerald-600 text-white disabled:opacity-50"
          disabled={!data || index === Object.keys(data.neighbors).length}
          onClick={() => handleNavClick(+1)}
        >
          <FiChevronRight size={80} className="stroke-white" />
        </button>
      </div>
      <Link href="/" className="absolute top-4 left-4">
        <FiArrowLeftCircle size={48} className="stroke-emerald-600" />
      </Link>
    </div>
  )
}

export {
  Trees,
}
