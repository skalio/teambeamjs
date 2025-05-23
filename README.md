# teambeamjs

CLI for the TeamBeam service

## Getting Started

Install the commandline tool via

```console
npm install -g skalio/teambeamjs
```

A global installation is recommended. Depending on your environment, you may need to execute this with superuser privileges.

A valid TeamBeam account is required to use `teambeamjs`. You can create one for free at [free.teambeam.de](https://free.teambeam.de/).

## Commands

The command line interface is available via the `teambeamjs` command. You can get a list of all available commands by running:

```console
$ teambeamjs --help
Usage: teambeam [options] [command]

TeamBeam CLI

Options:
  -V, --version                output the version number
  -h, --help                   display help for command

Commands:
  init [options]               Initialize configuration for teambeamjs
  upload [options] <files...>  Send a transfer
  download [options]           Download transfers from your inbox
  copy [options]               Copy transfers from your inbox to an archive folder
```

You can get more information about each command by using it with the `--help` flag.

### `init`

Once installed an initial configuration of `teambeamjs` is required by running this command:

```console
$ teambeamjs init
✔ API Host: https://free.teambeam.de
✔ Email: bob@example.org
✔ Password: *******
✔ Successfully logged in
✔ Config has been saved
```

You can then use all available commands.

### `upload`

You can send a TeamBeam transfer by using the `upload` command. The command requires some options that can either be passed via flags or interactively. You can specify the files and folders to upload
as arguments. The command will automatically zip folders before uploading.

```console
$ teambeamjs upload --to alice@example.com --message "Hello Alice, have a look at these pictures and videos. Aren't they gorgeous? Cheers, Bob" ./videos/ DSC01472.jpg DSC01473.jpg
✔ Created zip file for './videos/'
✔ Subject: Pics from yesterday
✔ TTL: 14 days
✔ Transfer upload |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■| 100%
✔ Successfully uploaded transfer
```

Or you can download transfers:

```console
$ teambeamjs download --include-sent --use-filename
▷ Fetching transfers...
▶ 2 transfers found. Downloading...

┌ Transfer 2kfqnlw7td5199oextpglgte92k57xknlldg1lp8
│
◆ File DSC01472.jpg |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■| 100%
◆ File DSC01473.jpg |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■| 100%
│
└ Done!

┌ Transfer 219wfpzuy5iozoyoe3yyraug3xi2r6ab0vbposct
│
◆ File DSC01540.jpg |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■| 100%
◆ File DSC01541.jpg |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■| 100%
│
└ Done!
```

### `download`

By default, `download` will retrieve all new (_unread_) transfers
that have been sent to the current user. As a result, transfers will get
downloaded only once.

#### Filters

This filter can be changed using and combining these flags:

- `--include-old`: Include transfers that have been downloaded before and are thus no longer marked as _unread_
- `--include-sent`: Include transfers that have been _sent_ by the current user

#### Filenames

The files of a transfer can contain all sorts of characters. When downloading these files, this may cause problems on the
downloading host, where some of these characters may not be readable or have conflicting
purposes.

Therefore, by default, `teambeamjs` uses a unique ASCII-based identifier when
naming downloaded files, called the _objectId_. This avoids any conflicts or
problems and leads to unique filenames. The intended filename, as specified
by the uploader, can be looked up in the transfer's metadata JSON object
`transfer.json`.

Set the flag `--use-filename` to instead use the original filenames.

#### Transfer metadata

When downloading a transfer, `teambeamjs` creates a JSON-encoded file containing
the metadata of the transfer. It is named `transfer.json` and located in the
downloaded transfer directory.

### `copy`

This command can be used to copy received transfer into a TeamBeam Transfer archive folder

```console
$ teambeamjs copy --folder 4711
┌ Fetching transfers...
◆ Found 3 transfers to copy
│
│ Copying into archive folder 4711...
◆ [████████████████████████████████████████] 3/3 transfers
│
└ Done!
```

## Documentation

### Configuration file

`teambeamjs` uses a configuration file to persist the necessary server and account
credentials to interact with the TeamBeam system.

> [!IMPORTANT]
> Make sure to protect the file as it contains sensitive credentials.

### Run command in a loop

You can provide the `--interval <delay>` option on the `download` or `copy` command run it in an endless loop with `<delay>` seconds in between each run.
This loop can be exited by using <kbd>Ctrl</kbd> + <kbd>C</kbd> or by manually killing `teambeamjs`'s process.

```console
$ teambeamjs download --interval 30
[09:41:03]
▷ Fetching transfers...
▶ 1 transfer found. Downloading...

┌ Transfer 2kfqnlw7td5199oextpglgte92k57xknlldg1lp8
│
◆ File i1oks3z4tk |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■| 100%
◆ File i1oks3z6t1 |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■| 100%
◆ File i1oks3z6tm |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■| 100%
│
└ Done!


[09:41:39]
▷ Fetching transfers...
▶ No new transfers found

[09:42:09]
▷ Fetching transfers...
▶ 1 transfer found. Downloading...

┌ Transfer 219wfpzuy5iozoyoe3yyraug3xi2r6ab0vbposct
│
◆ File b9bct3z7tp |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■| 100%
│
└ Done!

⠦ Next run in 30s...
```

### Updates

Use the node package manager to keep `teambeamjs` up to date:

```
$ sudo npm update -g skalio/teambeamjs
```

## Release History

- v1.0.0 2025-05-26 Reimplemented the entire tool from scratch using modern TypeScript to support the next generation of the TeamBeam platform.
- v0.3.1 2022-07-05 Files are now uploaded sequentially - one upload waiting before the next starts in order to prevent RateLimitExceptions. Lifting versions of dependencies.
- v0.3.0 2022-03-02 Adding new feature to copy received transfers to a drive folder. Interval actions now re-login on lost user sesion. Lifting versions of dependencies.
- v0.2.4 2019-06-20 Fixing issue with zipping folders prior to uploading. Lifting versions of dependencies.
- v0.2.3 2018-12-21 Fixing issue where uploads without content-length were rejected.
- v0.2.2 2018-07-24 Fixing issue where files without name extension could not be uploaded. Fixed download of already downloaded transfers.
- v0.2.1 2017-10-26 Fixing issue with number as transfer passphrase. Better temp folder support
- v0.2.0 2017-10-26 Fixing special characters issue. Proxy Support. Support for uploading directories. Quiet output flag. Support for IDN domains in E-Mail addresses.
- v0.1.3 2016-03-23 Fixing download; adding progress information when `--verbose`
- v0.1.2 2016-03-08 Adds support for download-intervals
- v0.1.1 2016-02-23 Adds support for transfer passwords
- v0.1.0 2016-01-26 Initial Release

`teambeamjs` releases are available on [github](https://github.com/skalio/teambeamjs).

## License

Copyright (c) 2025 Skalio GmbH <support@teambeam.de>

Licensed under the MIT license.
