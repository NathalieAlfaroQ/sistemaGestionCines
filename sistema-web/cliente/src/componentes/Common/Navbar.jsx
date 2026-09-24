import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

function Navbar() {
  const opciones = [
    'Sedes',
    'Películas',
    'Salas',
    'Proyecciones',
    'Empleados',
  ];

  return (
    <AppBar position="static" color="primary">
      <Toolbar>

        <Typography
          variant="h6"
          component="div"
        >
          Cines Aurora
        </Typography>
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'space-evenly',
            }}
          >
          {opciones.map((opcion) => (
            <Button
              key={opcion}
              color="inherit"
            >
              {opcion}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
