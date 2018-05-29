# ENTERPRISE BOT SERVICE

What is the lightest possible botkit studio client

very limited need to access lower level conversation build
  -> initiate a conversation/message with someone else
  -> single reply

run through studio as only behavior

persistent

fast

----

## core features

* web server
* message ingestion
* script walking
* trigger handling
* state management
* database access
* template handling

built-in plugins:

* persistence of user values/user list view
* plugin for console/transcripts
* web connector?
* console connector?

## plugin features

* platform adapter
    * slack

* platform APIs
* plugin for editor ui
* plugin for nlp


----

## todos:

* shouldEvaluate should be `bot instance specific` because different platforms have different event types - and considering for top level hearing is different than being included in a conversation. ie in slack hearing ambient after it is already active
* need a middleware endpoint that gets the _raw_ message before ingesting as well as the _delivered_ message sent to platform
* expose a function from webserver that lets you add static routes from plugins without including express in plugin
