const SedesTable = ({ sedes }) => {
  return (
    <div class="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
        <table class="w-full text-sm text-left rtl:text-right text-body text-text-color">
            <thead class="text-sm text-body bg-neutral-secondary-medium border-b border-default-medium">
                <tr>
                    <th scope="col" class="p-4">
                        <div class="flex items-center">
                        </div>
                    </th>
                    <th scope="col" class="px-6 py-3">
                        Nombre
                    </th>
                    <th scope="col" class="px-6 py-3">
                        Cuidad
                    </th>
                    <th scope="col" class="px-6 py-3">
                        Provincia
                    </th>
                    <th scope="col" class="px-6 py-3">
                        ...
                    </th>
                </tr>
            </thead>
            <tbody>
               {sedes.map((sede) => (
                <tr class="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                    <td class="w-4 p-4">
                        <div class="flex items-center">
                        </div>
                    </td>
                    <th scope="row" class="px-6 py-4 font-medium text-heading whitespace-nowrap">
                        {sede.nombre}
                    </th>
                    <td class="px-6 py-4">
                        {sede.ciudad}
                    </td>
                    <td class="px-6 py-4">
                        {sede.provincia}
                    </td>
                    <td class="px-6 py-4">
                        <a href="#" class="font-medium text-fg-brand hover:underline">Edit</a>
                    </td>
                </tr>
              ))}
            </tbody>
        </table>
        <nav class="flex items-center flex-column flex-wrap md:flex-row justify-between p-4" aria-label="Table navigation">
            <span class="text-sm font-normal text-body mb-4 md:mb-0 block w-full md:inline md:w-auto">Showing <span class="font-semibold text-heading">1-10</span> of <span class="font-semibold text-heading">1000</span></span>
            <ul class="flex -space-x-px text-sm">
                <li>
                    <a href="#" class="flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading font-medium rounded-s-base text-sm px-3 h-9 focus:outline-none">Previous</a>
                </li>
                <li>
                    <a href="#" class="flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading font-medium text-sm w-9 h-9 focus:outline-none">1</a>
                </li>
                <li>
                    <a href="#" class="flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading font-medium text-sm w-9 h-9 focus:outline-none">2</a>
                </li>
                <li>
                    <a href="#" aria-current="page" class="flex items-center justify-center text-fg-brand bg-brand-softer box-border border border-default-medium hover:bg-brand-soft hover:text-fg-brand font-medium text-sm w-9 h-9 focus:outline-none">3</a>
                </li>
                <li>
                    <a href="#" class="flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading font-medium text-sm w-9 h-9 focus:outline-none">...</a>
                </li>
                <li>
                    <a href="#" class="flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading font-medium text-sm w-9 h-9 focus:outline-none">5</a>
                </li>
                <li>
                    <a href="#" class="flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading font-medium rounded-e-base text-sm px-3 h-9 focus:outline-none">Next</a>
                </li>
            </ul>
        </nav>
    </div>



  );
};

export default SedesTable;
