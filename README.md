# Fauxton
    http://127.0.0.1:5984/_utils/#
# Command

```bash
# node bin/index.js --help
Usage: index [options] [command]

Options:
  -h, --help      display help for command

Commands:
  db                  Database operations
    sync              Sync database with Jira
    destroy <dbname>  Destroy database
    create <dbname>   Create database
  dummy               Dummy operations
    compare           Compare jira with db
  jira                Jira operations
    epicOverview      Epic overview
    prefixes          List all jira prefixes
    labels            List all jira labels
    fields            List all jira fields
  help [command]  display help for command
```