function ContenedorCliente({ className = '', children }) {
  return (
    <div className="mx-4 md:mx-8">
      <div className={`max-w-screen-2xl mx-auto px-8 ${className}`}>{children}</div>
    </div>
  );
}

export default ContenedorCliente;