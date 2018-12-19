Shapes Demo Server
==================

This is the server component for the shapes demo. It is a small node-express app 
that can be used to demonstrate the code required to integrate Approov 
with an existing node-express server.

Install Requirements
--------------------

To install the dependencies for the server, run this command from the current (`node-express/`) directory:

```
npm install
```

Running the Server
------------------

You can run the server on your desktop using node directly:

```
node application.js
```

This does not provide any security for the connection as it is not serving on HTTPS and is 
only intended as a demonstration. In a 
production system HTTPS should be used to help protect the communciation between client 
and server. Ideally [pinning][1] of the connection should also be used to further safeguard 
its security.

[1]:https://www.owasp.org/index.php/Certificate_and_Public_Key_Pinning
