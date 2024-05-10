/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";

const BackgroundImageCards: React.FC = () => {
  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-12">
        <div className="grid grid-cols-2 gap-2">
          <a href="#" className="p-8 col-span-2 text-left h-96 bg-[url('https://flowbite.s3.amazonaws.com/blocks/marketing-ui/hero/bmw-ix.png')] bg-no-repeat bg-cover bg-center bg-gray-500 bg-blend-multiply hover:bg-blend-normal">
            <h2 className="mb-5 max-w-xl text-5xl font-extrabold tracking-tight leading-tight text-white">Enjoy nature sustainable travel in the BMW iX</h2>
            <button type="button" className="inline-flex items-center px-4 py-2.5 font-medium text-center text-white border border-white rounded-lg hover:bg-white hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-700">
              Show more
            </button>
          </a>
          <a href="#" className="p-8 col-span-2 md:col-span-1 text-left h-96 bg-[url('https://flowbite.s3.amazonaws.com/blocks/marketing-ui/hero/bmw-m4.png')] bg-no-repeat bg-cover bg-center bg-gray-500 bg-blend-multiply hover:bg-blend-normal">
            <h2 className="mb-5 max-w-xl text-4xl font-extrabold tracking-tight leading-tight text-white">Enjoy nature sustainable travel in the BMW iX</h2>
            <button type="button" className="inline-flex items-center px-4 py-2.5 font-medium text-center text-white border border-white rounded-lg hover:bg-white hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-700">
              Show more
            </button>
          </a>
          <a href="#" className="p-8 col-span-2 md:col-span-1 text-left h-96 bg-[url('https://flowbite.s3.amazonaws.com/blocks/marketing-ui/hero/bmw-m6.png')] bg-no-repeat bg-cover bg-center bg-gray-500 bg-blend-multiply hover:bg-blend-normal">
            <h2 className="mb-5 max-w-xl text-4xl font-extrabold tracking-tight leading-tight text-white">Enjoy nature sustainable travel in the BMW iX</h2>
            <button type="button" className="inline-flex items-center px-4 py-2.5 font-medium text-center text-white border border-white rounded-lg hover:bg-white hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-700">
              Show more
            </button>
          </a>
        </div>
      </div>
    </section>
  )
}

export default BackgroundImageCards;