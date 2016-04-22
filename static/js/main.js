/**
 * AnderShell - Just a small CSS demo
 *
 * Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var level = 1;
var msg = new SpeechSynthesisUtterance();
var voices = window.speechSynthesis.getVoices();
msg.voice = voices[10]; // Note: some voices don't support altering params
msg.voiceURI = 'native';
msg.volume = 1; // 0 to 1
msg.rate = 1; // 0.1 to 10
msg.pitch = 0.8; //0 to 2
msg.lang = 'en-US';

 (function() {
  var $output;
  var _inited = false;
  var _locked = false;
  var _buffer = [];
  var _obuffer = [];
  var _ibuffer = [];
  var _cwd = "/";
  var _prompt = function() { return _cwd + " $ "; };
  var _history = [];
  var _hindex = -1;
  var _lhindex = -1;

  var _commands = {

    clear: function() {
      return false;
    },

    help: function() {
      var out = [
        'help                                         This command',
        'clear                                        Clears the screen',
      ];
      return out.join("\n");
    }


  };

  /////////////////////////////////////////////////////////////////
  // UTILS
  /////////////////////////////////////////////////////////////////

  function setSelectionRange(input, selectionStart, selectionEnd) {
    if (input.setSelectionRange) {
      input.focus();
      input.setSelectionRange(selectionStart, selectionEnd);
    }
    else if (input.createTextRange) {
      var range = input.createTextRange();
      range.collapse(true);
      range.moveEnd('character', selectionEnd);
      range.moveStart('character', selectionStart);
      range.select();
    }
  }

  function format(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    var sprintfRegex = /\{(\d+)\}/g;

    var sprintf = function (match, number) {
      return number in args ? args[number] : match;
    };

    return format.replace(sprintfRegex, sprintf);
  }


  function padRight(str, l, c) {
    return str+Array(l-str.length+1).join(c||" ")
  }

  function padCenter(str, width, padding) {
    var _repeat = function(s, num) {
      for( var i = 0, buf = ""; i < num; i++ ) buf += s;
      return buf;
    };

    padding = (padding || ' ').substr( 0, 1 );
    if ( str.length < width ) {
      var len     = width - str.length;
      var remain  = ( len % 2 == 0 ) ? "" : padding;
      var pads    = _repeat(padding, parseInt(len / 2));
      return pads + str + pads + remain;
    }

    return str;
  }

  function parsepath(p) {
    var dir = (p.match(/^\//) ? p : (_cwd  + '/' + p)).replace(/\/+/g, '/');
    return realpath(dir) || '/';
  }

  function getiter(path) {
    var parts = (path.replace(/^\//, '') || '/').split("/");
    var iter = null;

    var last = _filetree;
    while ( parts.length ) {
      var i = parts.shift();
      if ( !last[i] ) break;

      if ( !parts.length ) {
        iter = last[i];
      } else {
        last = last[i].type == 'dir' ? last[i].files : {};
      }
    }

    return iter;
  }

  function realpath(path) {
    var parts = path.split(/\//);
    var path = [];
    for ( var i in parts ) {
      if ( parts.hasOwnProperty(i) ) {
        if ( parts[i] == '.' ) {
          continue;
        }

        if ( parts[i] == '..' ) {
          if ( path.length ) {
            path.pop();
          }
        } else {
          path.push(parts[i]);
        }
      }
    }

    return path.join('/');
  }

  window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    function( callback ){
      window.setTimeout(callback, 1000 / 60);
    };
  })();

  /////////////////////////////////////////////////////////////////
  // SHELL
  /////////////////////////////////////////////////////////////////

  (function animloop(){
    requestAnimFrame(animloop);

    if ( _obuffer.length ) {
      $output.value += _obuffer.shift();
      _locked = true;

      update();
    } else {
      if ( _ibuffer.length ) {
        $output.value += _ibuffer.shift();

        update();
      }

      _locked = false;
      _inited = true;
    }
  })();

  function print(input, lp) {
    update();
    _obuffer = _obuffer.concat(lp ? [input] : input.split(''));
  }

  function update() {
    $output.focus();
    var l = $output.value.length;
    setSelectionRange($output, l, l);
    $output.scrollTop = $output.scrollHeight;
  }

  function clear() {
    $output.value = '';
    _ibuffer = [];
    _obuffer = [];
    print("");
  }

  function speakUp(text) {
    msg.text = text;
    speechSynthesis.speak(msg);
  }

  function command(cmd) {
    print("\n");
    if ( cmd.length ) {
        var a = cmd.split(' ');
        var c = a.shift();
        if ( c in _commands ) {
          var result = _commands[c].apply(_commands, a);
          if ( result === false ) {
            clear();
          } else {
            print(result || "\n", true);
          }
          print("\n\n" + _prompt());
        } else {
        $.when(
          $.ajax({
          type: "POST",
          url: "http://127.0.0.1:8080/api/v1/execute",
          dataType: "json",
          contentType: "application/json; charset=utf-8",
          data: JSON.stringify({'command': cmd}),
          success: function(data) {
              var result = data['result'];
              result += "\n"
              print(result || "\n", true);
          },
        })).done(function() {
        _history.push(cmd);

        if (cmd == 'help') {
          level ++;
          speakUp("The above is the help menu. You can try out commands from the same and explore the environment.");
          print("\nThe above is the help menu! You can try out commands from the same and explore the environment.\nWhen ready, type 'run'.", true);
        }
        if( cmd == 'run' && level == 1) {
          level++;
          speakUp("This is a program which calculates the factorial of a given number. So, now you see the output of the given program.");
          print("\n\nThis is a program which calculates the factorial of a given number.\nThe program will pause to take a number as input and then will display the output,\nwhich is the factorial of the input number.\nSo, now you see the output of the given program and observe that it exited normally with with code 015.\nWe will now perform some deeper analysis based on certain features that gdb provides. Also, we would\ntry to find out the error in the program which seems to be giving the wrong output\n", true);
          print("\nTo continue, let us have a look at the main function. To print main function, type 'l main'.", true);


        } else if (cmd == 'l main' && level==2) {
          level++;
          speakUp("To continue, let us have a look at some function. Print source code of factorial function.");
          print("\nTo continue, let us have a look at some function. To print source code of factorial function, type \n'l fact'.", true);

        } else if (cmd == 'l fact' && level == 3){
          level++;
          speakUp("You can pause the execution of the runing program when it reaches a specific line number or program point by setting a breakpoint.");
          print("\nYou can pause the execution of the runing program when it reaches a specific line number or program point,\nby setting a breakpoint.\nLet us set a breakpoint at the main function. Type 'b main'\n .", true);
        } else if (cmd == 'b main' && level == 4){
          level++;
          speakUp("Now that break point has been set, you can view details about it.");
          print("\nNow that break point has been set, you can view details about it. Type 'info b'.", true);

        } else if (cmd == 'info b' && level==5){
          level++;
          speakUp("Begin execution of the program by typing run.");
          print("\nBegin execution of the program by typing 'run'.", true);
        } else if (cmd == 'run' && level==6){
          level++;
          speakUp("We note that the execution of the program began and has paused at the main function.");
          print("\nWe note that the execution of the program began and has paused at the main function. Press 'n' to execute\nthe next line of the program. This can be used for line by line execution when done repeatedly.\nSet a breakpoint after the function call statement Continue line by line execution and then when you reach\nthe fact function call statement, type 'step' to step into the fact function.\n ", true);

        } else if (cmd == 'step' && level == 7) {
          level++;
          speakUp("Now you are inside the fact function.");
          print("\nNow you are inside the fact function. Type 'l' to view the next lines to be executed.\n", true);
        } else if (cmd == 'l' && level == 8) {
          level++;
          speakUp("Set a breakpoint at the beginning of the loop.");
          print("\nNote that we have a loop here. Set a breakpoint at the beginning of the loop. So, the program will pause\nonce, whenever one loop iteration is completed.\n", true);
        } else if (cmd == 'b' && level == 9) {
          level++;
          speakUp("You can also print the values of certain variables at every breakpoint");
          print("\nYou can also print the values of certain variables at every breakpoint by using the 'display' command.\nType 'display f' to print the value of f at every iteration.\n", true);
        } else if (cmd == 'display f' && level == 10) {
          level++;
          speakUp("You can print the value of the loop counter variabe at every iteration.");
          print("\nType 'display i' to print the value of the loop counter variabe at every iteration.\n", true);
        } else if (cmd == 'display i' && level == 11) {
          level++;
          speakUp("We can now continue the execution of the program.");
          print("\nWe can now continue the execution of the program. Type continue and observe the value of the display\nvariables at each breakpoint.\n", true);
        } else if (cmd == 'c' && level == 12) {
          //level++;
          print("\nType 'info b' if you reach the outside the function, back inside main.\n", true);
        } else if (cmd == 'info b' && level == 12) {
          level++;
          speakUp("You see a list of breakpoints which you had set.");
          print("\nYou see a list of breakpoints which you had set. You can delete them too by typing 'del <bpno>' like 'del 1' \n .", true);

        } else if (cmd == 'del 1' && level == 13) {
          level++;
          speakUp("You can continue the execution and end the program. Thank You.");
          print("\nYou can continue the execution and end the program. Thank You.\n", true);
        }
        print("\n\n" + _prompt());
      });
      }
    }
    _hindex = -1;
    // clear();
  }

  function nextHistory() {
    if ( !_history.length ) return;

    var insert;
    if ( _hindex == -1 ) {
      _hindex  = _history.length - 1;
      _lhindex = -1;
      insert   = _history[_hindex];
    } else {
      if ( _hindex > 1 ) {
        _lhindex = _hindex;
        _hindex--;
        insert = _history[_hindex];
      }
    }

    if ( insert ) {
      if ( _lhindex != -1 ) {
        var txt = _history[_lhindex];
        $output.value = $output.value.substr(0, $output.value.length - txt.length);
        update();
      }
      _buffer = insert.split('');
      _ibuffer = insert.split('');
    }
  }

  window.onload = function() {

    speakUp("Welcome! GDB, the GNU Project debugger, allows you to see what is going on inside another program while it executes.");

    $output = document.getElementById("output");
    $output.contentEditable = true;
    $output.spellcheck = false;
    $output.value = '';

    $output.onkeydown = function(ev) {
      var k = ev.which || ev.keyCode;
      var cancel = false;

      if ( !_inited ) {
        cancel = true;
      } else {
        if ( k == 9 ) {
          cancel = true;
        } else if ( k == 38 && !ev.ctrlKey ) {
          nextHistory();
          cancel = true;
        } else if ( k == 40 && !ev.ctrlKey ) {
          cancel = true;
        } else if ( k == 38 && ev.ctrlKey ) {
          $output.scrollTop -= 20;
        } else if ( k == 40 && ev.ctrlKey ) {
          $output.scrollTop += 20;
        } else if ( k == 37 || k == 39 ) {
          cancel = true;
      }
    }

      if ( cancel ) {
        ev.preventDefault();
        ev.stopPropagation();
        return false;
      }

      if ( k == 8 ) {
        if ( _buffer.length ) {
          _buffer.pop();
        } else {
          ev.preventDefault();
          return false;
        }
      }

      return true;
    };

    $output.onkeypress = function(ev) {
      ev.preventDefault();
      if ( !_inited ) {
        return false;
      }

      var k = ev.which || ev.keyCode;
      if ( k == 13 ) {
        var cmd = _buffer.join('').replace(/\s+/, ' ');
        _buffer = [];
        command(cmd);
      } else if (k == 33) {
      }
      else {
        if ( !_locked ) {
          var kc = String.fromCharCode(k);
          _buffer.push(kc);
          _ibuffer.push(kc);
        }
      }

      return true;
    };

    $output.onfocus = function() {
      update();
    };

    $output.onblur = function() {
      update();
    };

    window.onfocus = function() {
      update();
    };

    // print("Initializing AnderShell 3000 v0.1 ....................................................\n");
    // print("Copyright (c) 2014 Anders Evenrud <andersevenrud@gmail.com>\n\n", true);

    //print("------------------------------------------------------------------------------------------------------------------");
    print("                  @@@  @@@  @@@  @@@@@@@@  @@@        @@@@@@@   @@@@@@   @@@@@@@@@@   @@@@@@@@                  \n", true);
    print("                  @@@  @@@  @@@  @@@@@@@@  @@@       @@@@@@@@  @@@@@@@@  @@@@@@@@@@@  @@@@@@@@                  \n", true);
    print("                  @@!  @@!  @@!  @@!       @@!       !@@       @@!  @@@  @@! @@! @@!  @@!                       \n", true);
    print("                  !@!  !@!  !@!  !@!       !@!       !@!       !@!  @!@  !@! !@! !@!  !@!                       \n", true);
    print("                  @!!  !!@  @!@  @!!!:!    @!!       !@!       @!@  !@!  @!! !!@ @!@  @!!!:!                    \n", true);
    print("                  !@!  !!!  !@!  !!!!!:    !!!       !!!       !@!  !!!  !@!   ! !@!  !!!!!:                    \n", true);
    print("                  !!:  !!:  !!:  !!:       !!:       :!!       !!:  !!!  !!:     !!:  !!:                       \n", true);
    print("                  :!:  :!:  :!:  :!:        :!:      :!:       :!:  !:!  :!:     :!:  :!:                       \n", true);
    print("                   :::: :: :::    :: ::::   :: ::::   ::: :::  ::::: ::  :::     ::    :: ::::                  \n", true);
    print("                    :: :  : :    : :: ::   : :: : :   :: :: :   : :  :    :      :    : :: ::                   \n", true);
    print("\n\n\n", true);

    print(padCenter("Welcome to the GDB tutorial.\n", 113), true);

    print("\n\n", true);
    print("GDB, the GNU Project debugger, allows you to see what is going on 'inside' another program while it\nexecutes-- or what another program was doing at the moment it crashed.\n\n\n", true);
    print("GDB can do four main kinds of things (plus other things in support of these) to help you catch bugs\nin the act:\n", true);
    print("• Start your program, specifying anything that might affect its behavior.\n", true);
    print("• Make your program stop on specified conditions.\n", true);
    print("• Examine what has happened, when your program has stopped.\n", true);
    print("• Change things in your program, so you can experiment with correcting the effects of one bug and go on to\nlearn about another.\n\n", true);
    // print("Type 'help' for a list of available commands.\n", true);
    print("Let us run our program now, shall we? Please type 'run' in the prompt to clear Level 1.\n", true);
    print("\n\n" + _prompt());

  };

})();
