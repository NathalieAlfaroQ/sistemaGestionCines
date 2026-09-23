function Hero() {
  return (
    <div className="relative h-screen bg-slate-700">
      <div className="absolute left-15 top-1/2 -translate-y-1/2 font-bold text-white">
        Flecha
      </div>
      <h1 className="absolute max-w-3xl text-4xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-bold text-white">
        LA PANTALLA GRANDE TE ESPERA.
        <br />
        CONSIGUE TUS BOLETOS.
      </h1>
      <div className="absolute right-15 top-1/2 -translate-y-1/2 font-bold text-white">
        Flecha
      </div>
    </div>
  )
}

export default Hero