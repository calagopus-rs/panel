# calagopus-rs panel (basically stable)

a rewrite of [pterodactyl panel](https://github.com/pterodactyl/panel) in the rust programming language. This rewrite aims to be a better alternative to the original panel, implementing new features, better performance and a new UI.

## todo

[frontend](https://notes.rjns.dev/workspace/cb7ccae8-0508-4f90-9161-d1e69b0ca8f0/oXJcC5ei3IQhEf1RFCh6K)
[backend](https://notes.rjns.dev/workspace/cb7ccae8-0508-4f90-9161-d1e69b0ca8f0/xfvzMIFHkFSMnOfO_WUEO)

## very detailed installation instructions

This "guide" assumes you have the docker daemon installed on your system.

```sh
mkdir calagopus
cd calagopus

wget https://raw.githubusercontent.com/calagopus-rs/panel/refs/heads/main/compose.yml
RANDOM_STRING=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
sed -i -e "s/CHANGEME/$RANDOM_STRING/g" compose.yml

docker compose up -d
# visit the panel at your servers ip with port 8000
```

To update

```sh
cd calagopus

docker compose pull
docker compose up -d
```
