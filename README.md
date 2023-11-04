# typo - Tiny Photo Organizer

## Usage

```shell
$ typo pictures/
pictures/DSC07992.JPG => 2018/2018-11-04/DSC07992.JPG (exif)
pictures/DSC07993.JPG => 2018/2018-11-04/DSC07993.JPG (exif)
pictures/DSC07994.JPG => 2018/2018-11-04/DSC07994.JPG (exif)
pictures/DSC07995.JPG => 2018/2018-11-04/DSC07995.JPG (exif)
pictures/DSC07996.JPG => 2018/2018-11-04/DSC07996.JPG (exif)

$ typo pictures/**/*.JPG -o out/{year}/{month}/{date}/ --dryrun
pictures/DSC07992.JPG => out/2018/11/04/DSC07992.JPG (exif)
pictures/DSC07993.JPG => out/2018/11/04/DSC07993.JPG (exif)
pictures/DSC07994.JPG => out/2018/11/04/DSC07994.JPG (exif)
pictures/DSC07995.JPG => out/2018/11/04/DSC07995.JPG (exif)
pictures/DSC07996.JPG => out/2018/11/04/DSC07996.JPG (exif)
```
