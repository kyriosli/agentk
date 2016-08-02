(function () {
    document.write('<p>Well done! The static file has been loaded successfully.</p>');

    document.write('<p>Advanced: use module static_file to handle static file. </p>');
    document.write('<pre>import static_file from "module/static_file.js";\nroute.prefix(\'/static\', static_file(\'static\'));</pre>');


    document.write('<h3>Step 2. add a new url pattern</h3>');
    document.write('<p>Now try to add a new url. Copy the following code into <code>src/route.js</code> after static file handler:</p>');
    document.write('<pre>route.match(/^\\/(\\w+)/, function (req, viewname) {\n' +
        '    return view.render(viewname, {\n' +
        '        title: viewname,\n' +
        '        query: req.query\n    });\n});</pre>');
    document.write('<p>Don\'t forget to restart your program</p>');
    document.write('<p><a href="step2?time=' + +new Date + '">Try this link</a></p>');


})();