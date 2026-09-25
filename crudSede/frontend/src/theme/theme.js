import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',

    primary: {
      main: '#3D1D53',
    },

    background: {
      default: '#1F1F24',
      paper: '#000000',
    },
  },

  typography: {
    fontFamily: 'Manrope, sans-serif',
    fontSize: 16,
  },

  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },

      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
        },
      },
    },
  },

});

export default theme;
