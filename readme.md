# BK 1.0

Completely rebuilt from the ground up to ease development of conversational software on any platform.

## Open Issues:
* admin login accounts
* can write config options to config file?? that way, database string could be set in admin.
* consider how the order of loading plugins makes a difference. "installed" plugins not loaded til boot is called, but local custom plugins would probably be loaded BEFORE them... pros and cons! could they all be put into a list and sorted by the UI?
* shouldEvaluate should be _bot instance specific_ because different platforms have different event types - and considering for top level hearing is different than being included in a conversation. ie in slack hearing ambient after it is already active
* think about what happens if a persisted convo gets auto-closed or overwritten.  is there a timeout? is there an end event?
* how to stash info about a user OUTSIDE of a convo like in a middleware or event handler
* now that variables are persisted automatically -- what happens if you want to reset them?
* if a studio.before handler calls executeScript, it can result in double firing events because the event queue continues to process events after the original before is called and can reach the new event AGAIN. can be solved by clever ordering of events in code but not ideal!! this is kind of caused by the fact that studio.before wraps middleware.beforeScript, which fires for every script instead of just the one in question.
