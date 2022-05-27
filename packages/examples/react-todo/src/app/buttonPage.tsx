
import {useEdict} from "@edict/react";
import {attr, rule} from "@edict/core";


const enum BACKGROUND_COLOR {
  RED = "#ff0000",
  GREEN = "#00ff00"
}

const enum FONT_COLOR {
  WHITE = "#ffffff",
  BLACK = "#000000"
}
export function ButtonPage() {
  const {query, insert} = useEdict(
    {
      factSchema: {
        count: attr<number>(),
        color: attr<string>(),
        fontColor: attr<string>(),
      },
      rules: ({count, fontColor, color},{insert}) => ({
        "button_count": rule({
          what: {
            button: {
              count
            }
          },
          then: ({button}) => {
            insert({button: {color: button.count % 2 === 0 ? BACKGROUND_COLOR.GREEN : BACKGROUND_COLOR.RED}})
          }
        }),
        "button_color": rule({
          what: {
            button: {
              color
            }
          },
          then: ({button}) => {
            insert({button: {fontColor: button.color === BACKGROUND_COLOR.RED ? FONT_COLOR.WHITE : FONT_COLOR.BLACK}})
          }
        }),
        "button_state": rule({
          what: {
            button: {
              color,
              count,
              fontColor
            }
          }
        }),
      }),
      initialFacts: {
        button: {
          count: 0,
          color: BACKGROUND_COLOR.GREEN,
          fontColor: FONT_COLOR.BLACK
        },
      }
    }
  )

  const results = query("button_state")
  const {color, count, fontColor} = results[0].button
  return (
    <div>

            <div style={{color: fontColor, backgroundColor: color, width: "200px", fontSize: "24px", textAlign: "center"}}
                 onClick={() => insert({button: {count: count + 1}})}>Count: {count}</div>
      <a href={"/game"}>Game</a>
    </div>
  );
}
