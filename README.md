# pterodactyl-rs panel (experimental)

a rewrite of [pterodactyl panel](https://github.com/pterodactyl/panel) in the rust programming language. This rewrite aims to be a better alternative to the original panel, implementing new features and better performance.

## quick installation

### please remember that this is an experimental rewrite and is not meant to be used in production

```bash
sudo curl -L "https://github.com/pterodactyl-rs/panel/releases/latest/download/panel-rs-$(uname -m)-linux$(ldd --version 2>&1 | grep -q 'GLIBC 2.3[5-9]\|GLIBC 2.[4-9]' || echo '-musl')" -o /usr/local/bin/panel
sudo chmod +x /usr/local/bin/panel

panel
```

## Important

- This panel will only work in combination with [wings-rs](https://github.com/pterodactyl-rs/wings)
