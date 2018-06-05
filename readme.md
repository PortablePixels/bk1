# BK 1.0

Completely rebuilt from the ground up to ease development of conversational software on any platform.

## Open Issues:

* consider how the order of loading plugins makes a difference. "installed" plugins not loaded til boot is called, but local custom plugins would probably be loaded BEFORE them... pros and cons! could they all be put into a list and sorted by the UI?
* shouldEvaluate should be `bot instance specific` because different platforms have different event types - and considering for top level hearing is different than being included in a conversation. ie in slack hearing ambient after it is already active
* expose a function from webserver that lets you add static routes from plugins without including express in plugin
* expose a function for determining a plugin's relative path for loading views or other local assets without loading path in every module
