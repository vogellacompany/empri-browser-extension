# GitHub Privacy


## Install

	$ yarn install

## Development

    yarn run dev chrome
    chromium-browser --load-extension="<PATH>/empri-devops/github-privacy/dist/chrome/"
    yarn run dev firefox
    yarn run dev opera
    yarn run dev edge
    microsoft-edge --load-extension="<PATH>/github-privacy/dist/chrome/"

## Build

    yarn run build chrome
    yarn run build firefox
    yarn run build opera
    yarn run build edge

## Environment

The build tool also defines a variable named `process.env.NODE_ENV` in your scripts.

## Docs

* [webextension-toolbox](https://github.com/HaNdTriX/webextension-toolbox)

## EMPRI-DEVOPS

This extension is being developed as part of the [EMPRI-DEVOPS](https://empri-devops.de/) research project.
