function PiePagina() {
  return (
    <footer className="w-full px-20 py-4 text-text-color" style={{ backgroundColor: '#000000' }}>
     <div className="max-w-screen-2xl mx-auto">

        <h3 className="mb-2 text-base ">Historia</h3>

        <div className="mb-4 flex gap-">
          <a href="#" aria-label="Facebook" className="text-text-muted hover:text-text-color">
            <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M13.135 6H15V3h-1.865a4.147 4.147 0 0 0-4.142 4.142V9H7v3h2v9.938h3V12h2.021l.592-3H12V6.591A.6.6 0 0 1 12.592 6h.543Z" clipRule="evenodd"/>
            </svg>
          </a>

          <a href="#" aria-label="Instagram" className="text-text-muted hover:text-text-color">
            <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path fill="currentColor" fillRule="evenodd" d="M3 8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8Zm5-3a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8Zm7.597 2.214a1 1 0 0 1 1-1h.01a1 1 0 1 1 0 2h-.01a1 1 0 0 1-1-1ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-5 3a5 5 0 1 1 10 0 5 5 0 0 1-10 0Z" clipRule="evenodd"/>
            </svg>
          </a>
        </div>

        <p className="text-sm text-text-muted">
          © Cine Aurora 2026. Derechos reservados. Términos y condiciones
        </p>
      </div>
    </footer>
  )
}
export default PiePagina