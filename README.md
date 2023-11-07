# mcsrv_ventania
mcsrv ventania 1.19.1

## Startup
```bash
SERVER_MEMORY=2048M ./scripts/start.sh
```

## Save current world state
```bash
./scripts/sync.sh
```

It is highly recommended to schedule a cronjob to run this script every 5 minutes or so.