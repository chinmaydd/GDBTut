# mu3

Did you just say that you don't know what gdb does? Well, we've got a solution for ya! <br /> <br />

``mu3`` is a small project to help newcomers get acquiainted to gdb in a fun manner! We take inspiration from [Try Git](https://try.github.io) for the overall structure of the tutorial. We have organized the tutorial in form of levels so as to make the teaching process easier and faster.

## User Interface

We've got a hacky interface for you with configurable background music! Since this project was developed as a part of our Human Computer Interaction course, we have also enabled voice instructions(using Google's Speech Synthesis API).

## Usage Instructions

After cloning the project, you can follow instructions as below:

### Requirements

To run the Python server, you will require bottle. You can install it using pip:

```bash
$ pip install bottle
```

You will also need to compile the main.c file in the test directory as:
```bash
$ gcc -g -o test/a.out main.c
```

Include ```jquery.min.js``` file in your root ```static/js/``` directory. You are then ready to go!

### Configurable files

You can setup your own ```test.mp3``` file in the project directory as background music.

### How to run?
```bash
$ python main.py
```

Navigate to ```localhost:8080``` on your browser and see the magic unfold!

You can also change the test file and work on something of your choice.

## Contributions

This project is currently a work-in-progress and we would love contributions from everyone. You might experience lag and slow output, but bear with us for now. We are working on it!

## Acknowledgements

We would like to thank [Anders Evenrud](https://github.com/andersevenrud/retro-css-shell-demo) for his awesome Retro CSS project!

## License

MIT