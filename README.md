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
$ teambeamjs upload --to alice@example.com --subject "Pics from yesterday" DSC01472.jpg DSC01473.jpg
User "bob@example.org" has logged in successfully
Message (end with . on empty line):
> Hello Alice,
> have a look at the pictures below. Aren't they gorgeous?
> Cheers,
>   Bob
> .
Creating new reservation
Reservation created
Uploading "f18yeoxn2e" (81780 Bytes)
Upload finished: {"size":81780,"objectId":"f18yeoxn2e","status":200,"chunkEnd":0,"chunkStart":0,"chunkedTransfer":false,"totalFileSize":0}
Uploading "f18yeoy3ho" (143275 Bytes)
Upload finished: {"size":143275,"objectId":"f18yeoy3ho","status":200,"chunkEnd":0,"chunkStart":0,"chunkedTransfer":false,"totalFileSize":0}
Confirming reservation "1mas9tsr42kt7nv980emf3sice"
Reservation confirmed
User "bob@example.org" has logged out successfully
```

Or you can download transfers:
```
$ teambeamjs download --include-sent
User "bob@example.org" has logged in successfully
Downloading transfers for "hank@pray4snow.de"
Created "/Users/Bob/Downloads/transfers/1d326lr5k474209uf4hnglb57cbpimw4htqp33lg"
Downloading files for transfer "1d326lr5k474209uf4hnglb57cbpimw4htqp33lg"
Download starting for "f18yeoxn2e"
Download completed for "f18yeoy3ho"
All files for transfer "1d326lr5k474209uf4hnglb57cbpimw4htqp33lg" have been downloaded
Transfer "1d326lr5k474209uf4hnglb57cbpimw4htqp33lg" exported to "/Users/hank/Downloads/transfers/1d326lr5k474209uf4hnglb57cbpimw4htqp33lg/transfer.json"
Transfer download completed
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

### Update teambeamjs
Use the node package manager to keep `teambeamjs` up to date:

```
$ sudo npm update -g skalio/teambeamjs
```

## Release History
* v0.1.1: 2016-02-23, Adds support for transfer passwords
* v0.1.0: 2016-01-26, Initial Release

`teambeamjs` releases are available on [github](https://github.com/skalio/teambeamjs).

## License
Copyright (c) 2015 Skalio GmbH <info@skalio.com>

Licensed under the MIT license.
