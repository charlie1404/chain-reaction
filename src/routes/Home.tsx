import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Input, VStack, NativeSelect, InputGroup, Button } from "@chakra-ui/react";
import { GameLogo } from "../components/Logo";

//==============================================================================================

function CreateGame({
  boardSize,
  setBoardSize,
  username,
  changeUsername,
  createGame,
}: {
  boardSize: App.BoardSize;
  setBoardSize: (value: App.BoardSize) => void;
  username: string;
  changeUsername: (value: string) => void;
  createGame: () => void;
}) {
  return (
    <VStack spaceY={4}>
      <InputGroup startAddon="Name">
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => changeUsername(e.target.value)}
        />
      </InputGroup>
      <InputGroup startAddon="Board Size">
        <NativeSelect.Root>
          <NativeSelect.Field
            value={boardSize}
            onChange={(e) => setBoardSize(e.target.value as App.BoardSize)}
            borderTopLeftRadius="0"
            borderBottomLeftRadius="0"
          >
            <option value="s">Small</option>
            <option value="l">Large</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </InputGroup>
      <Button variant="solid" colorScheme="green" onClick={createGame}>
        Create
      </Button>
    </VStack>
  );
}

function JoinGame({
  username,
  changeUsername,
  roomId,
  setRoomId,
  joinGame,
}: {
  username: string;
  changeUsername: (value: string) => void;
  roomId: string;
  setRoomId: (value: string) => void;
  joinGame: () => void;
}) {
  return (
    <Stack spacing={4}>
      <InputGroup>
        <InputLeftAddon>Name</InputLeftAddon>
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => changeUsername(e.target.value)}
        />
      </InputGroup>
      <InputGroup>
        <InputLeftAddon>RoomId</InputLeftAddon>
        <Input
          type="text"
          placeholder="RoomId"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
      </InputGroup>
      <Button
        variant="solid"
        colorScheme="green"
        onClick={() => {
          joinGame();
        }}
      >
        Join
      </Button>
    </Stack>
  );
}

function Home() {
  const navigate = useNavigate();

  const [boardSize, setBoardSize] = useState<App.BoardSize>(() => {
    return (localStorage.getItem("boardSize") as App.BoardSize) || "s";
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem("username") || "";
  });

  function changeUsername(value: string) {
    localStorage.setItem("username", value);
    setUsername(value);
  }

  function changeBoardSize(value: App.BoardSize) {
    localStorage.setItem("boardSize", value);
    setBoardSize(value);
  }

  function createGame() {
    // create-game
    navigate(`/game/1`);
  }

  function joinGame() {
    // join-game
    navigate(`/game/1`);
  }

  return (
    <>
      <GameLogo />
      <Box maxW="lg" mt={12} p={0} ml={"auto"} mr={"auto"} boxShadow="md" borderRadius="md">
        <CreateGame
          username={username}
          boardSize={boardSize}
          setBoardSize={changeBoardSize}
          changeUsername={changeUsername}
          createGame={createGame}
        />
      </Box>
    </>
  );
}

export default Home;
