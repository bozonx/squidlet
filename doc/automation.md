# Automation

    rules:
      - name: ruleName
        trigger:
         - type: status
           id: room.button
        action:
          - type: action
            id: room.light
            action: turn
            if:
              - type: and
                check:
                  - type: status
                    id: room.binarySensor
                    statusName: default
                    level: high
            value:
              - type: status
                id: room.button
                statusName: default
                invert: false
              - type: and
                check:
                  - type: status
                    id: room.light1
                    invert: true
                  - type: status
                    id: room.light2
                    invert: true
