import { Box, Container, Paper, Typography } from "@mui/material";

export const Footer = () => {
  return (
    <Paper sx={{marginTop: 'calc(10% + 60px)',
      width: '100%',
      position: 'fixed',
      bottom: 0,
    }} component="footer" square variant="outlined">
      <Container maxWidth="lg">
        <Box
          sx={{
            flexGrow: 1,
            justifyContent: "center",
            display: "flex",
            mb: 0,
          }}
        >
          <Typography variant="caption" color="initial">
            Powered by <a href="spotify.com">Spotify</a> Created by <a href="https://github.com/matuszelenak">@matuszelenak</a>.
          </Typography>
        </Box>
      </Container>
    </Paper>
  )
}
