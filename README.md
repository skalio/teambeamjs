# teambeamjs

Client to access the TeamBeam service.

## Getting Started
Install the commandline tool with: `npm install -g skalio/teambeamjs`. It is
recommended that you install the tool globally. Depending on your environment, you may need to execute this with superuser privileges.

You need a valid TeamBeam account in order to use `teambeamjs`. Create one for
free at [free.teambeam.de](https://free.teambeam.de/my/).

`teambeamjs` provides help screens wherever possible:
```
$ teambeamjs --help
```

Once installed, create an initial configuration file:
```
$ teambeamjs init
Settings could not be imported
Creating a new config file
Please provide the details of your TeamBeam account.


Your email address []: bob@example.org
Your password: ******
Hostname [free.teambeam.de]:
Save settings (y/N)? y
Settings have been saved
```

Then upload some files. If some information is missing, `teambeamjs` will ask
you for it.
```
$ teambeamjs upload --to alice@example.com --subject 'Pics from yesterday' DSC01472.jpg DSC01473.jpg
User "bob@example.org" has logged in successfully
Message (end with . on empty line):
> Hello Alice,
> have a look at the pictures below. Aren't they gorgeous?
> Cheers,
>   Bob
> .
Creating new reservation
Reservation "1mas9tsr42kt7nv980emf3sice" created
Uploading "f18yeoxn2e" (81780 Bytes)
Upload of "f18yeoxn2e" completed
Uploading "f18yeoy3ho" (143275 Bytes)
Upload of "f18yeoy3ho" completed
Confirming reservation "1mas9tsr42kt7nv980emf3sice"
Reservation confirmed
User "bob@example.org" has logged out successfully
```

For the strings in --message and --subject please use single quotes (') instead of double quotes (").
Strings in single quotes are not expanded by bash and therefore not interpreted, making sure special characters do not cause problems.

Or you can download transfers:
```
$ teambeamjs download --include-sent
User "bob@example.org" has logged in successfully
Downloading transfers for "bob@example.org"
Created "/Users/Bob/Downloads/transfers/1d326lr5k474209uf4hnglb57cbpimw4htqp33lg"
Downloading files for transfer "1d326lr5k474209uf4hnglb57cbpimw4htqp33lg"
Download starting for "f18yeoxn2e"
Download completed for "f18yeoy3ho"
All files for transfer "1d326lr5k474209uf4hnglb57cbpimw4htqp33lg" have been downloaded
Transfer "1d326lr5k474209uf4hnglb57cbpimw4htqp33lg" exported to "/Users/Bob/Downloads/transfers/1d326lr5k474209uf4hnglb57cbpimw4htqp33lg/transfer.json"
Transfer download completed
User "bob@example.org" has logged out successfully
```

Another option is to copy received transfers to a Drive folder
```
$ teambeamjs copy --dir 4711
Logging in user "tv@skalio.com"
User "bob@example.org" has logged in successfully
Copying transfers for "bob@example.org"
Response contains 248 entries
No transfers to copy
User "bob@example.org" has logged out successfully
```

## Documentation

### Configuration files
`teambeamjs` uses configuration files to hold the necessary account and server
configuration to access a TeamBeam server.

**Security notice:** The configuration files contain your access credentials
for the given TeamBeam servers. Make sure to protect the files accordingly.

Use different configuration files, if you have multiple accounts. To select
a config file, use the `--config` flag.

Create the config file:
```
$ teambeamjs init --config ~/bob-at-work.teambeamjs
Settings could not be imported
Creating a new config file
Please provide the details of your TeamBeam account.


Your email address []: user.bob@example.com
Your password: ********
Hostname [teambeam.example.com]:
Save settings (y/N)? y
Settings have been saved
```

Use the config file when uploading / downloading:
```
$ teambeamjs upload --config ~/bob-at-work.teambeamjs path/to/file
...
$ teambeamjs download --config ~/bob-at-work.teambeamjs
...
```
### Transfer metadata
When downloading a transfer, `teambeamjs` creates a JSON-encoded file containing
the metadata of the transfer. It is named `transfer.json` and located in the
downloaded transfer directory.

### Selective transfer download
By default, `teambeamjs download` will retrieve all new (_unread_) transfers
that have been sent to the current user. As a result, transfers will get
downloaded only once.

This filter can be changed using these flags:
* `--include-old`: Also download transfers that have been downloaded before and are no longer marked _unread_
* `--include-sent`: Also download transfers that have been _sent_ by the current user

These flags can be combined.

### Transfer filenames
It is legal to use all sorts of characters when naming files during a TeamBeam
upload. When downloading these files however, this may cause problems on the
downloading host, where characters may not be readable or have conflicting
purposes.

Therefore, by default, `teambeamjs` uses a unique ASCII-based identifier when
naming downloaded files, called the _objectId_. This avoids any conflicts or
problems and leads to unique filenames. The intended filename, as specified
by the uploader, can be looked up in the transfer's metadata JSON object
`transfer.json`.

To use the intended filenames instead, use the flag `--use-filename`.

### Downloading or copying transfers in a loop
Using the `--interval <delay>` option when in download- or copy-mode, `teambeamjs` will
enter an endless loop of download or copy requests. In between requests, it
will sleep `<delay>` seconds. To exit the loop, kill the process or CTRL-C out.

```
$ teambeamjs download --interval 5
Logging in user "bob@example.org"
User "bob@example.org" has logged in successfully
Downloading transfers for "bob@example.org"
Transfer download completed
Waiting 5 seconds
Downloading transfers for "bob@example.org"
Transfer download completed
Waiting 5 seconds
^C
```

### Update teambeamjs
Use the node package manager to keep `teambeamjs` up to date:

```
$ sudo npm update -g skalio/teambeamjs
```

## Release History
* v0.3.0    2022-03-02  Adding new feature to copy received transfers to a drive folder. Interval actions now re-login on lost user sesion. Lifting versions of dependencies.
* v0.2.4    2019-06-20  Fixing issue with zipping folders preio to uploading. Lifting versions of dependencies.
* v0.2.3    2018-12-21  Fixing issue where uploads without content-length were rejected.
* v0.2.2    2018-07-24  Fixing issue where files without name extension could not be uploaded. Fixed download of already downloaded transfers.
* v0.2.1    2017-10-26  Fixing issue with number as transfer passphrase. Better temp folder support
* v0.2.0    2017-10-26  Fixing special characters issue. Proxy Support. Support for uploading directories. Quiet output flag. Support for IDN domains in E-Mail addresses.
* v0.1.3    2016-03-23  Fixing download; adding progress information when `--verbose`
* v0.1.2    2016-03-08  Adds support for download-intervals
* v0.1.1    2016-02-23  Adds support for transfer passwords
* v0.1.0    2016-01-26  Initial Release

`teambeamjs` releases are available on [github](https://github.com/skalio/teambeamjs).

## License
Copyright (c) 2022 Skalio GmbH <support@teambeam.de>

Licensed under the MIT license.
