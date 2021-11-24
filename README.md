# GitHub Privacy

GitHub Privacy redacts timestamps such as commit dates on GitHub.
The precision of timestamps is reduced according to your preference.
Click on individual timestamps to reveal more precision if needed.

## About

GitHub Privacy is a browser add-on that demonstrates privacy-friendly reduction of timestamp precision on GitHub.
It is developed as part of the [EMPRI-DEVOPS](https://empri-devops.de/) research project.
The extension and our study are not connected to GitHub, Inc. in any way.

### Precision vs. data minimisation

Timestamps are usually found on GitHub where they describe the time of a user action:
For example, the time of a commit or the assignment of an issue.
Since they make the temporal behaviour of users traceable and in part publicly documented,
timestamps represent a privacy risk.
Their collection must be necessary and comply with the principles of data minimisation.

Earlier [case studies in the EMPRI-DEVOPS project](https://doi.org/10.1007/978-3-030-31500-9_9) already pointed out,
that applications collect an unnecessarily large number of timestamps and with unnecessarily high precision.
On GitHub, too, timestamps are recorded to the second, although they are usually only displayed to the minute at most.


### How much precision is needed?

To give developers and also users an indication in the future,
about what is an appropriate precision for informative timestamps in applications like GitHub,
we have developed the _Git Privacy_ demonstrator.
On the one hand, it already allows users to experience and test the effect of reducing timestamp precision on GitHub.
On the other hand, if users opt in, the demonstrator provides statistical data about preferred precisions,
to get an indication of actual needs.
More about the study on timestamp precision demands is described [here](https://empri-devops.de/timestamp-precision-study/).


## Installation

Together with the project partner vogella, the University of Hamburg has implemented the demonstrator as a browser add-on.
The extension is available for installation in the add-on stores of the following browsers:

- [Chrome](https://chrome.google.com/webstore/detail/github-privacy/dnnaopdmfcnmfjidhjchjcpeloangenl)
- [Firefox](https://addons.mozilla.org/firefox/addon/github-privacy/)
- [Edge](https://microsoftedge.microsoft.com/addons/detail/github-privacy/ejgfdgcflfnoedplfojcmekoilmafddl)
- [Opera](https://addons.opera.com/de/extensions/details/github-privacy/)


## Development and Contribution

Our build process requires the following tools:

* [webextension-toolbox](https://github.com/HaNdTriX/webextension-toolbox)

### Run development version

```
yarn run dev chrome
chromium-browser --load-extension="<PATH>/empri-devops/github-privacy/dist/chrome/"
yarn run dev firefox
yarn run dev opera
yarn run dev edge
microsoft-edge --load-extension="<PATH>/github-privacy/dist/chrome/"
```

### Build

Run the following command and specify the vendor as chrome, firefox, opera, or edge.
```
yarn run build <VENDOR>
```

### Environment

The build tool also defines a variable named `process.env.NODE_ENV` in your scripts.
