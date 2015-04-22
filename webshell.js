var ShellError = function(message) {
  this.message = message;
};

ShellError.prototype = new Error;

var Shell = function() {
  this.fs = {
    bin: {
      cat: this.cat,
      cd: this.cd,
      date: this.date,
      echo: this.echo,
      help: this.help,
      ls: this.ls,
      pwd: this.pwd,
      whoami: this.whoami,
    },
    home: {
      nick: {
        'about.txt': 'This shell was created with a bit of JavaScript\n',
      },
    },
    tmp: {},
  };
  this.cwd = ['home', 'nick'];
  this.user = 'nick';
  this.history = [];
};

Shell.prototype.resolvePath = function(str) {
  var parts = str.split('/');
  var path;
  if (str[0] == '/') {
    path = [];
    parts.shift();
  } else if (parts[0] == '~') {
    path = ['home', 'nick'];
    parts.shift();
  } else {
    path = this.cwd.slice(0);
  };
  for (var i = 0; i < parts.length; i++) {
    if (parts[i] == '..') {
      path.pop();
    } else if (parts[i] != '.' && parts[i] != '') {
      path.push(parts[i]);
    };
  };
  return path;
};

Shell.prototype.getPath = function(path) {
  var currentItem = this.fs;
  for (var i = 0; i < path.length; i++) {
    currentItem = currentItem[path[i]];
    if (currentItem === undefined) {
      throw new ShellError('No such file or directory');
    };
  };
  return currentItem;
};

Shell.prototype.cat = function(args) {
  var output = '';
  for (var i = 1; i < args.length; i++) {
    var file = this.getPath(this.resolvePath(args[i]));
    if (typeof file == 'object') {
      throw new ShellError(args[i] + ' is a directory');
    } else if (typeof file == 'function') {
      throw new ShellError(args[i] + ' is a binary file');
    };
    output += file;
  };
  return output;
};

Shell.prototype.cd = function(args) {
  if (args.length == 1) {
    this.cwd = ['home', 'nick'];
  } else {
    var path = this.resolvePath(args[1]);
    if (typeof this.getPath(path) != 'object') {
      throw new ShellError(args[1] + ' is not a directory');
    };
    this.cwd = path;
  };
  return '';
};

Shell.prototype.date = function(args) {
  return new Date();
};

Shell.prototype.echo = function(args) {
  return args.slice(1).join(' ');
};

Shell.prototype.help = function() {
  return [
    'cat    - Output the contents of a file',
    'cd     - Change directory',
    'date   - Shows the current date',
    'echo   - Outputs whatever is given to it',
    'help   - Display this help dialog',
    'ls     - List a directory',
    'pwd    - Display current directory',
    'whoami - Shows your username'
  ].join('\n');
};

Shell.prototype.ls = function(args) {
  var path = this.cwd;
  if (args.length > 1) {
    path = this.resolvePath(args[1]);
  };
  var dir = this.getPath(path);
  if (typeof dir == 'object') {
    return Object.keys(dir).join('\n');
  } else {
    return args[1];
  };
};

Shell.prototype.pwd = function() {
  return '/' + this.cwd.join('/');
};

Shell.prototype.welcome = function() {
  return 'Welcome! Type "help" to see a list of commands\n';
};

Shell.prototype.whoami = function() {
  return this.user;
};

Shell.prototype.command = function(text) {
  this.history.unshift(text);

  var args = text.split(' ');
  args = args.filter(function(arg) { return arg != ''; });

  try {
    var program;
    if (args.length == 0) {
      return '';
    } else if (this.fs.bin[args[0]] !== undefined) {
      program = this.fs.bin[args[0]].bind(this);
    } else if (args[0].indexOf('/') != -1) {
      program = this.getPath(this.resolvePath(args[0]));
      if (typeof program != 'function') {
        throw new ShellError(args[0] + ' is not executable');
      };
      program = program.bind(this);
    } else {
      throw new ShellError('Command not found');
    };

    var out = program(args);
    if (out != '' && out[out.length - 1] != '\n') {
      out += '\n';
    };
    return out;
  } catch (e) {
    if (e instanceof ShellError) {
      return e.message + '\n';
    } else {
      return 'Error\n';
    };
  };
};

window.addEventListener('load', function() {
  var shell = new Shell();

  var terminal = document.getElementById('terminal');
  var output = document.getElementById('output');
  var input = document.getElementById('input');

  var historyPosition = -1;

  terminal.addEventListener('click', function() {
    input.focus();
  });

  input.addEventListener('keypress', function(e) {
    if (e.keyCode == 13) {
      output.textContent += '$ ' + input.value + '\n';
      output.textContent += shell.command(input.value);
      input.value = '';
      historyPosition = -1;
      terminal.scrollTop = terminal.scrollHeight - terminal.offsetHeight;
    };
  });

  input.addEventListener('keydown', function(e) {
    if (e.keyCode == 38) {
      historyPosition = Math.min(historyPosition + 1, shell.history.length - 1);
      if (historyPosition >= 0) {
        input.value = shell.history[historyPosition];
      };
    } else if (e.keyCode == 40) {
      if (historyPosition > 0) {
        historyPosition -= 1;
        input.value = shell.history[historyPosition];
      } else if (historyPosition == 0) {
        input.value = '';
      };
    };
  });

  output.textContent = shell.welcome();
});