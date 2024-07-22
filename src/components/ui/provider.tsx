"use client"

import { ChakraProvider, createSystem, defaultConfig  } from "@chakra-ui/react"
import { PropsWithChildren } from "react"


export const system = createSystem(defaultConfig, {
  globalCss: {
    body: {
      bg: '#000'
    }
  },
  theme: {
    keyframes: {
      logoTextKeyFrameAnim: {
        '0%': { strokeDashoffset: 1600 },
        '70%': {},
        '100%': { strokeDashoffset: 0 },
      }
    }
  },
})

export function Provider(props: PropsWithChildren<{}>) {
  return (
    <ChakraProvider value={system}>
      {props.children}
    </ChakraProvider>
  )
}
