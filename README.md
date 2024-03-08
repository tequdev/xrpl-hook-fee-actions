# xrpl-hook-fee-actions

Get the fee information of the Hook code in the repository and make a comment on the PR.

```yml
name: test
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
  workflow_dispatch:
permissions:
  pull-requests: write
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: checkout
        uses: actions/checkout@v4
      - name: Test Actions
        uses: tequdev/xrpl-hook-fee-actions@v1
        with:
          inPath: contracts # Path to the contracts files(c files).
```
