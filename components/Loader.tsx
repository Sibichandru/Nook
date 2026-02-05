'use client'

const Loader = ({className="loader-container"}: {className?: string}) => {
  return (
    <div className={`flex flex-1 justify-center items-center h-full w-full ${className}`}>
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