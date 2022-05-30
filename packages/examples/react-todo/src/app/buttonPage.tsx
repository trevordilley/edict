
import {useEdict} from "@edict/react";
import {attr, rule} from "@edict/core";
import {useEffect, useMemo, useRef} from "react";
import _ from "lodash";


const enum BACKGROUND_COLOR {
  RED = "#ff0000",
  GREEN = "#00ff00"
}

const enum FONT_COLOR {
  WHITE = "#ffffff",
  BLACK = "#000000"
}
export function ButtonPage() {
  const { insert, addRule } = useEdict(
    {
      factSchema: {
        count: attr<number>(),
        color: attr<string>(),
        fontColor: attr<string>(),
      }})

  const queries = useMemo(() => ({
    buttonCount: addRule(({count}, {insert}) =>
      rule({
        name: "button_count",
        what: {
          button: {
            count
          }
        },
        then: ({button}) => {
          insert({button: {color: button.count % 2 === 0 ? BACKGROUND_COLOR.GREEN : BACKGROUND_COLOR.RED}})
        }
      })),
      buttonColor: addRule(({color}, {insert}) => rule({
        name: "button_color",
        what: {
          button: {
            color
          }
        },
        then: ({button}) => {
          insert({button: {fontColor: button.color === BACKGROUND_COLOR.RED ? FONT_COLOR.WHITE : FONT_COLOR.BLACK}})
        }
      })),
      buttonState: addRule(({color, count, fontColor}) => rule({
        name: "button_state",
        what: {
          button: {
            color,
            count,
            fontColor
          }
        }
      })),
    }),[])
    useEffect(() => {
      insert({button: {
          count: 0,
          color: BACKGROUND_COLOR.GREEN,
          fontColor: FONT_COLOR.BLACK
        }})
      console.log("insertinig")
    }, [])
  const results = queries.buttonState.query()
  const button = _.first(results)?.button
  if(!button) return <span/>
  const {color, count, fontColor} = button
  return (
    <div>

            <div style={{color: fontColor, backgroundColor: color, width: "200px", fontSize: "24px", textAlign: "center"}}
                 onClick={() => insert({button: {count: count + 1}})}>Count: {count}</div>
    </div>
  );
}
