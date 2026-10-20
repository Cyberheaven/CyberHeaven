---
title: "Linux Command-Line Cheat Sheet"
category: "Cheat Sheets"
date: 2026-07-15
author: "PurpleShonen"
excerpt: "Linux is one of the most widely used operating systems in the world, and with such a high level of usage, it has essentially become one of the most important tools for any IT professional to have. A lot of Linux’s power resides in the terminal emulator."
cover: "/media/2026/07/Linux-Command-Line-Cheat-Sheet.png"
coverAlt: "Linux Command Line Cheat Sheet"
tags: ["Linux", "Linux Administration", "Linux Cheat Sheet", "Linux CLI", "Linux Command Line", "Linux Commands", "Linux File Permissions", "Linux for Beginners", "Linux Networking", "Linux Terminal"]
draft: false
---

Linux is one of the most widely used operating systems in the world, and with such a high level of usage, it has essentially become one of the most important tools for any IT professional to have. A lot of Linux’s power resides in the terminal emulator.

In this article, I will share a Linux command-line cheat sheet to help you get started with using Linux. The commands mentioned below will serve as the foundation for working across the different distributions and families of Linux, as there are many of them.

![](/media/2026/07/terminal-1024x576.png)

## Get Started

I will start by explaining how the Linux terminal works. This is an oversimplified explanation to give you a basic understanding. The terminal is software that you use to communicate with the operating system. Anything you type into it is passed to a shell, which interprets the command and, when appropriate, executes the corresponding program.

For starters, one question that has plagued humanity for centuries: whoami.

```
whoami
```

After running this command, it will print your username, allowing you to know which user you are currently logged in as. It is also quite often used by attackers after they breach a system to determine which user they are operating as.

## File Management

Let’s create a file. There are multiple ways to create a file, but one of the most common is the `touch` command. It is used to create an empty file or update the timestamps of an existing file.

If you want to create a file with some content, you can use the `echo` command. This command is used to print something to the screen, but you can redirect that output (hey, save this) to a file using `>`. For appending content, which means adding content to the end of an existing file, you can use `>>`.

Be careful, though: the single `>` symbol will overwrite the contents of a file if it already exists.

```
touch test.txt
```

```
echo "Konnichiwa, World" > test.txt
```

Now that you have created a file, you might want to delete it. For that, you can use the `rm` command. It can be used to delete both files and folders.

```
rm test.txt
```

Let’s make a folder. To create a folder, you can use the `mkdir` command. This command accepts the name of the folder you want to create and will create it for you.

```
mkdir mynicefolder
```

To delete the folder you just created, you can use the `rmdir` command. It is used to delete empty folders.

If you have multiple files inside the folder, you will need to use the previous command with a cute little flag. A flag is a special option that you use to modify how a command behaves, allowing it to perform additional functions, such as deleting a non-empty folder.

For this, you can use `rm -r`. The `-r` flag stands for **recursive** , which tells the command to delete the folder and everything inside it.

```
rmdir mynicefolder
```

```
rm -rf mynicefolder
```

There are two more useful commands you should know, the copy and move commands.

For copying files, you can use the `cp` command. It follows the syntax `<file to copy> <location to copy to>`.

```
cp test.txt /home/skipper
```

For moving files, you can use the `mv` command. It follows the same syntax as the `cp` command, but instead of creating a copy, it moves the file entirely to a new location.

```
mv test.txt /home/purpleshonen
```

## Navigation

Before we learn to move across different directories or folders, we need to know which directory you are currently in, and for that, there is a very useful command called `pwd`. It stands for **print working directory** , and it will print the directory you are currently working in.

```
pwd
```

Linux filesystems follow a tree-like structure, and you can imagine it as an upside-down tree. You are moving towards or up the tree towards the root, and when you move to a different directory, for example `/home/skipper`, you are moving away and downward from the root. This will make more sense with the infographic below, and the root directory is `/` in Linux, unlike in Windows, where you typically have different drive letters such as `C:\`.

![](/media/2026/07/tree-1024x576.png)

Before you can navigate around and change directories, you need to learn about the `ls` command, which is used for listing files and directories. If you don’t provide any `<location>`, it’s gonna print out the files and directories in the current directory.

```
ls
```

In order to move around, you use the `cd` command, which stands for **change directory**. In order to go back to the previous directory, you can use `..`, which acts somewhat like the back button in a file explorer and moves you one directory up. To change directory to another folder, you need to put the name of the directory you are trying to move into.

```
cd ..
```

```
cd mynicefolder
```

As I mentioned above, Linux has a tree-like hierarchy. It also has two types of paths, and each works to achieve the same goal but works differently. These two are **absolute paths** and **relative paths**. I will explain these in a little more detail.

An absolute path starts from the root. An example of it would be `/home/skipper/test.txt`; this is an absolute path.

A relative path starts from the current working directory. For example, if you are currently in `/home/skipper`, you can use `../purpleshonen/` to move to the `purpleshonen` directory under `/home`. This is considered a relative path because it is resolved based on your current working directory.

I hope that makes sense. It’s important to understand, as it is crucial when moving around to different directories or using any command that requires a path.

Now that you have a good understanding of how to navigate around, and if you want to go to your home directory from any directory, then you can use the `~` symbol, which represents your home directory.

```
cd ~/
```

## Permissions

Linux uses **discretionary access control (DAC)** for its traditional file permission system, which means the owner of a file or folder can decide what permissions different users have, subject to the system’s permission rules. In Linux, to see the permissions of different files, you can use the `-l` flag with the `ls` command. It’s gonna show the permissions for the owner, then the permissions for the group, and lastly the permissions for others.

![](/media/2026/07/permission-1024x601.png)

In order to change the permissions, we use the `chmod` command, which is short for **change mode** , aka changing permissions. In the example below, you will see how we can make a file or script executable by using the `+x` option and then the name of the filename.

```
chmod +x test.bin
```

To remove the execute permission, you can change the `+x` to `-x`. Now the file will no longer have the execute permission that was previously added.

```
chmod -x test.bin
```

There are multiple options you can use aside from the execute permission. For read permission, you can use the `+r` option, and for write permission, you can use `+w`. Being able to manipulate permissions is a very crucial part of the Linux system. You should familiarize yourself with `chmod` commands, as it’s a very useful yet powerful command.

## Networking

Networking is also a very crucial part of Linux, and there are a few important commands you should be familiar with. Some of the important ones start with the `ip` command. This command is a very powerful utility that is used to manage networking, IP addresses, routing tables, and network interfaces.

To view the IP addresses configured on your system, you can use the `address show` argument to list and view them.

```
ip address show
```

If you specifically want to view IPv4 addresses, you can use:

```
ip -4 address show
```

In order to view the network interfaces available or check their state, you can use the `link show` argument, which will list and show all the available interfaces on your system.

```
ip link show
```

These were some of the common commands that would come in handy when using the Linux operating system, and below I will add a table of the most common commands used in everyday use that would be a valuable asset to learn.

Before I end this article, I have one last command.

If you don’t know what a specific command does or you want to learn more about any of the commands covered, then you can use the `man <command name>` command, which will open up a manual that you can read to further understand how to use that specific command and what other options it supports.

```
man <command>
```

## Cheat Sheet

Below are some of the most useful Linux commands that you should familiarize yourself with. The commands covered above are intentionally left out, so this section can serve as a quick reference for commands that you haven’t seen yet.

### Files & Directories

<table><thead><tr><th>Command</th><th>What it does</th><th>Example</th></tr></thead><tbody><tr><td><code>cat</code></td><td>Displays the contents of a file</td><td><code>cat test.txt</code></td></tr><tr><td><code>less</code></td><td>Lets you read a file one screen at a time</td><td><code>less test.txt</code></td></tr><tr><td><code>head</code></td><td>Displays the beginning of a file</td><td><code>head test.txt</code></td></tr><tr><td><code>tail</code></td><td>Displays the end of a file</td><td><code>tail test.txt</code></td></tr><tr><td><code>file</code></td><td>Determines the type of a file</td><td><code>file test.txt</code></td></tr><tr><td><code>find</code></td><td>Searches for files and directories</td><td><code>find /home -name "test.txt"</code></td></tr><tr><td><code>locate</code></td><td>Quickly searches for files by name</td><td><code>locate test.txt</code></td></tr><tr><td><code>tree</code></td><td>Displays directories in a tree structure</td><td><code>tree /home</code></td></tr><tr><td><code>ln</code></td><td>Creates links to files</td><td><code>ln -s /path/to/file link</code></td></tr><tr><td><code>stat</code></td><td>Displays detailed file information</td><td><code>stat test.txt</code></td></tr></tbody></table>

### Text Processing

<table><thead><tr><th>Command</th><th>What it does</th><th>Example</th></tr></thead><tbody><tr><td><code>grep</code></td><td>Searches for text inside files or command output</td><td><code>grep "password" file.txt</code></td></tr><tr><td><code>sort</code></td><td>Sorts lines of text</td><td><code>sort names.txt</code></td></tr><tr><td><code>uniq</code></td><td>Removes or identifies repeated lines</td><td><code>uniq names.txt</code></td></tr><tr><td><code>cut</code></td><td>Extracts sections from lines of text</td><td><code>cut -d: -f1 /etc/passwd</code></td></tr><tr><td><code>wc</code></td><td>Counts lines, words, and characters</td><td><code>wc -l file.txt</code></td></tr><tr><td><code>tr</code></td><td>Translates or removes characters</td><td><code>tr 'a-z' 'A-Z'</code></td></tr><tr><td><code>sed</code></td><td>Searches and transforms text</td><td><code>sed 's/foo/bar/g' file.txt</code></td></tr><tr><td><code>awk</code></td><td>Processes and analyzes structured text</td><td><code>awk '{print $1}' file.txt</code></td></tr><tr><td><code>diff</code></td><td>Compares two files</td><td><code>diff file1.txt file2.txt</code></td></tr></tbody></table>

### Processes & System

<table><thead><tr><th>Command</th><th>What it does</th><th>Example</th></tr></thead><tbody><tr><td><code>ps</code></td><td>Displays running processes</td><td><code>ps aux</code></td></tr><tr><td><code>top</code></td><td>Displays running processes and system activity</td><td><code>top</code></td></tr><tr><td><code>htop</code></td><td>Interactive process viewer</td><td><code>htop</code></td></tr><tr><td><code>kill</code></td><td>Sends a signal to a process</td><td><code>kill 1234</code></td></tr><tr><td><code>pkill</code></td><td>Sends a signal to processes by name</td><td><code>pkill firefox</code></td></tr><tr><td><code>jobs</code></td><td>Shows jobs running in the current shell</td><td><code>jobs</code></td></tr><tr><td><code>bg</code></td><td>Sends a stopped job to the background</td><td><code>bg</code></td></tr><tr><td><code>fg</code></td><td>Brings a background job to the foreground</td><td><code>fg</code></td></tr><tr><td><code>free</code></td><td>Displays memory usage</td><td><code>free -h</code></td></tr><tr><td><code>df</code></td><td>Displays filesystem disk usage</td><td><code>df -h</code></td></tr><tr><td><code>du</code></td><td>Displays the size of files and directories</td><td><code>du -sh /home</code></td></tr><tr><td><code>uptime</code></td><td>Shows how long the system has been running</td><td><code>uptime</code></td></tr><tr><td><code>uname</code></td><td>Displays system information</td><td><code>uname -a</code></td></tr><tr><td><code>hostname</code></td><td>Displays or changes the system hostname</td><td><code>hostname</code></td></tr><tr><td><code>lsblk</code></td><td>Lists block devices and storage drives</td><td><code>lsblk</code></td></tr><tr><td><code>mount</code></td><td>Mounts a filesystem</td><td><code>mount /dev/sdb1 /mnt</code></td></tr><tr><td><code>umount</code></td><td>Unmounts a filesystem</td><td><code>umount /mnt</code></td></tr></tbody></table>

### Networking

<table><thead><tr><th>Command</th><th>What it does</th><th>Example</th></tr></thead><tbody><tr><td><code>ping</code></td><td>Tests network connectivity</td><td><code>ping 8.8.8.8</code></td></tr><tr><td><code>ss</code></td><td>Displays network sockets and connections</td><td><code>ss -tuln</code></td></tr><tr><td><code>curl</code></td><td>Transfers data from or to a URL</td><td><code>curl https://example.com</code></td></tr><tr><td><code>wget</code></td><td>Downloads files from the web</td><td><code>wget https://example.com/file.zip</code></td></tr><tr><td><code>dig</code></td><td>Performs DNS lookups</td><td><code>dig example.com</code></td></tr><tr><td><code>nslookup</code></td><td>Performs DNS queries</td><td><code>nslookup example.com</code></td></tr><tr><td><code>traceroute</code></td><td>Shows the route packets take to a destination</td><td><code>traceroute example.com</code></td></tr><tr><td><code>hostnamectl</code></td><td>Displays or manages hostname information</td><td><code>hostnamectl</code></td></tr><tr><td><code>arp</code></td><td>Displays or modifies ARP information</td><td><code>arp -a</code></td></tr></tbody></table>

### Users & Permissions

<table><thead><tr><th>Command</th><th>What it does</th><th>Example</th></tr></thead><tbody><tr><td><code>id</code></td><td>Displays user and group information</td><td><code>id</code></td></tr><tr><td><code>groups</code></td><td>Shows the groups a user belongs to</td><td><code>groups</code></td></tr><tr><td><code>sudo</code></td><td>Executes a command with elevated privileges</td><td><code>sudo command</code></td></tr><tr><td><code>su</code></td><td>Switches to another user</td><td><code>su username</code></td></tr><tr><td><code>passwd</code></td><td>Changes a user’s password</td><td><code>passwd</code></td></tr><tr><td><code>chown</code></td><td>Changes the owner of a file</td><td><code>sudo chown user file.txt</code></td></tr><tr><td><code>chgrp</code></td><td>Changes the group ownership of a file</td><td><code>sudo chgrp developers file.txt</code></td></tr><tr><td><code>umask</code></td><td>Displays or changes the default permission mask</td><td><code>umask</code></td></tr></tbody></table>

### Archives & Compression

<table><thead><tr><th>Command</th><th>What it does</th><th>Example</th></tr></thead><tbody><tr><td><code>tar</code></td><td>Creates or extracts archives</td><td><code>tar -cf archive.tar files/</code></td></tr><tr><td><code>gzip</code></td><td>Compresses files using gzip</td><td><code>gzip file.txt</code></td></tr><tr><td><code>gunzip</code></td><td>Decompresses gzip files</td><td><code>gunzip file.txt.gz</code></td></tr><tr><td><code>zip</code></td><td>Creates ZIP archives</td><td><code>zip archive.zip file.txt</code></td></tr><tr><td><code>unzip</code></td><td>Extracts ZIP archives</td><td><code>unzip archive.zip</code></td></tr></tbody></table>

### Package Management

Package management commands depend on the Linux distribution you are using.

<table><thead><tr><th>Command</th><th>What it does</th><th>Example</th></tr></thead><tbody><tr><td><code>apt</code></td><td>Manages packages on Debian-based distributions</td><td><code>sudo apt install nmap</code></td></tr><tr><td><code>dnf</code></td><td>Manages packages on Fedora-based distributions</td><td><code>sudo dnf install nmap</code></td></tr><tr><td><code>pacman</code></td><td>Manages packages on Arch-based distributions</td><td><code>sudo pacman -S nmap</code></td></tr><tr><td><code>rpm</code></td><td>Works with RPM packages</td><td><code>rpm -qa</code></td></tr><tr><td><code>dpkg</code></td><td>Works with Debian packages</td><td><code>dpkg -l</code></td></tr></tbody></table>

### Services & Logs

<table><thead><tr><th>Command</th><th>What it does</th><th>Example</th></tr></thead><tbody><tr><td><code>systemctl</code></td><td>Manages systemd services</td><td><code>systemctl status sshd</code></td></tr><tr><td><code>journalctl</code></td><td>Reads systemd logs</td><td><code>journalctl -u sshd</code></td></tr><tr><td><code>dmesg</code></td><td>Displays kernel messages</td><td><code>dmesg</code></td></tr><tr><td><code>service</code></td><td>Manages services on systems that support it</td><td><code>service ssh status</code></td></tr></tbody></table>

### Shell & Environment

<table><thead><tr><th>Command</th><th>What it does</th><th>Example</th></tr></thead><tbody><tr><td><code>clear</code></td><td>Clears the terminal</td><td><code>clear</code></td></tr><tr><td><code>history</code></td><td>Displays previously executed commands</td><td><code>history</code></td></tr><tr><td><code>alias</code></td><td>Creates command shortcuts</td><td><code>alias ll='ls -la'</code></td></tr><tr><td><code>env</code></td><td>Displays environment variables</td><td><code>env</code></td></tr><tr><td><code>printenv</code></td><td>Prints environment variables</td><td><code>printenv HOME</code></td></tr><tr><td><code>export</code></td><td>Sets an environment variable</td><td><code>export NAME=value</code></td></tr><tr><td><code>which</code></td><td>Shows the location of a command</td><td><code>which python</code></td></tr><tr><td><code>whereis</code></td><td>Locates binaries, source files, and manuals</td><td><code>whereis python</code></td></tr><tr><td><code>type</code></td><td>Shows how the shell interprets a command</td><td><code>type cd</code></td></tr><tr><td><code>echo $PATH</code></td><td>Displays the command search path</td><td><code>echo $PATH</code></td></tr></tbody></table>

### Useful Shortcuts

<table><thead><tr><th>Shortcut</th><th>What it does</th></tr></thead><tbody><tr><td><code>Ctrl + C</code></td><td>Stops the currently running command</td></tr><tr><td><code>Ctrl + D</code></td><td>Exits the current shell or sends EOF</td></tr><tr><td><code>Ctrl + L</code></td><td>Clears the terminal screen</td></tr><tr><td><code>Ctrl + Z</code></td><td>Suspends the current process</td></tr><tr><td><code>Ctrl + R</code></td><td>Searches through command history</td></tr><tr><td><code>Tab</code></td><td>Autocompletes commands, paths, and filenames</td></tr><tr><td><code>↑ / ↓</code></td><td>Moves through command history</td></tr><tr><td><code>!!</code></td><td>Repeats the previous command</td></tr><tr><td><code>&amp;&amp;</code></td><td>Runs the next command only if the previous command succeeds</td></tr><tr><td><code>|</code></td><td>Pipes the output of one command into another</td></tr><tr><td><code>&gt;</code></td><td>Redirects output and overwrites a file</td></tr><tr><td><code>&gt;&gt;</code></td><td>Redirects output and appends to a file</td></tr><tr><td><code>2&gt;</code></td><td>Redirects standard error</td></tr><tr><td><code>2&gt;&amp;1</code></td><td>Redirects standard error to standard output</td></tr></tbody></table>

This is by no means an exhaustive list of Linux commands. Linux has thousands of commands and utilities, and many of them are designed for very specific tasks. However, learning these commands will give you a much stronger foundation for working with the Linux command line.
