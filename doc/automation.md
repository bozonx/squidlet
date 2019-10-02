# Automation

## Rule

Every rule consist of:

* name - unique name of rule
* trigger section - it's listeners of events e.g device status. After any trigger fulfilled it will go to
  the next section.
* check section - it's full check to allow do actions or not.
* action section - it's list of actions to to after trigger and check sections are fulfilled.
* actionAsync - call actions step by step.


## Example

    rules:
      - name: ruleName
        trigger:
         - type: status
           id: room.button
        check:                                # Checks for whole rule it will be started after triggers
          - type: and
          ...
        action:                               # Actions to do. It will be started after trigger and check.
          - type: action
            id: room.light
            action: turn
            if:
              - type: and
                check:
                  - type: statusBoolean
                    id: room.binarySensor
                    statusName: default
            values:
              - type: status
                id: room.button
                statusName: default
              - type: and
                check:
                  - type: statusBoolean
                    id: room.light1
                    invert: true
                  - type: booleanStatus
                    id: room.light2
                    invert: true
