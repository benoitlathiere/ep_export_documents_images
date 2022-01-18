ep_export_documents_images
======

# FAQ

I compiled here some questions answered by mail or in EPL forums.

Last update : 2016.02.16

### Q: When I export a pad, I can read "error: Can't open display" or "No protocol specified" in the log and EPL crashes.

A: If you did a previous export as root and now as a normal user, the "/tmp/LibO_Conversion/" directory is owned by root (or another user) and your non-root user can't use it now.
EPL running owner and "/tmp/LibO_Conversion/" directory owner must be the same.
You need to remove the "/tmp/LibO_Conversion/" directory and restart EPL as normal user.
If you change often the user running EPL, You can put the setting "remove_LOdir" to 'true' (see _readme.md_ for details). The directory will be recreated each time you export your pad. If you do dozens of exports per minute, You will prefer put "false" to avoid to be short of performances.

### Q: When I export a pad with multibyte characters set (as Japanese, Chinese or Korean characters sets), characters are replaced by garbled ones.

A: Check your 'Office' version (in a command line interface : _soffice --version_ ). It appears there is some problems with Office version<3.5 to convert some characters. Try to update your Office to 3.5 version or above.
Thanks to Keiji from Japan to help me to find the solution!
