# udemy-dl-gui

A pre-alpha version, its bit slow and unoptimized but its kind of a workable.
if u like to test the gui version.

# NodeJS version udemy-dl
Nodejs script to download a udemy.com course (videos only), for personal offline use.

### Installation
```
npm install -g udemy-dl
```

### Version
**1.0.0**

### New Updates
 - *(20/1/2019) * added export all links as json option.
 - *(20/1/2019) * support for corporate login (thanks to @Sab94) 
 - *Published gui version at https://electronjs.org/apps/udl-gui

### Usage
![udemy-dl usage](https://raw.githubusercontent.com/riazXrazor/udemy-dl/master/gif/udemy-dl.gif)

Simply call `udl` with the full URL to the course page.
```
udl https://www.udemy.com/COURSE_NAME
```
`udemy-dl` will ask for your udemy username (email address) and password then start downloading the videos.

By default, `udemy-dl` will create a subdirectory based on the course name.  If you wish to have the files downloaded to a specific location, use the `-o \path\to\directory\` parameter.

If you wish, you can include the username/email and password on the command line using the -u and -p parameters.

```
udl -u user@domain.com -p $ecRe7w0rd https://www.udemy.com/COURSE_NAME
```

For information about all available parameters, use the `--help` parameter
```
udl --help
```

### Advanced Usage

```
Usage: udl <course_url> [-u "username"] [-p "password"]

Commands:
  course_url  URL of the udemy coures to download

Options:
  -u, --username    Username in udemy                                   [string]
  -p, --password    Password of yor account                             [string]
  -r, --resolution  Download video resolution, default resolution is 360, for
                    other video resolutions please refer to the website.[number]
  -o, --output      Output directory where the videos will be saved, default is
                    current directory                                   [string]
  -h, --host        Business name, in case of Udemy for Business
                                                          [string] [default: ""]
  -e, --export      Export as JSON                    [boolean] [default: false]
  -?, --help        Show help                                          [boolean]

By Riaz Laskar

```


### Updates
 - *(20/1/2019) * added export all links as json option.
 - *(20/1/2019) * support for corporate login (thanks to @Sab94) 
 - *(19/11/2018)* updated login process
 - *(26/05/2018)* New feature downloads subtitles now.
 - *(26/05/2018)* Large course list issue fix
 - *(16/05/2018)* Course selection list added, no more url needed.
 - *(09/05/2018)* Added course number in download.
 - *(02/05/2018)* Bug fixes to for code changes in udemy.
 - *(02/05/2018)* Course materials are also downloaded now.
 - *(08/12/2017)* Added option to select resolution.
 - *(08/12/2017)* Added new download statistics data.

