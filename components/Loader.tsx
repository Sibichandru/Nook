'use client'

const Loader = () => {
  return (
    <div className="flex flex-1 justify-center items-center h-full w-full loader-container">
      <img
        src="/assets/loading.svg"
        alt="Loading"
        width={40}
        height={40}
      />

    </div>
  )
}

export default Loader