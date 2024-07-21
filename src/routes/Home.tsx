import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Input,
  Stack,
  InputGroup,
  InputLeftAddon,
  Card,
  Button,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Select,
} from '@chakra-ui/react';

function Home() {
  const navigate = useNavigate();
  const { pathname, state } = useLocation();

  const [username, setUsername] = useState('');
  const [count, setCount] = useState(2);
  const [roomId, setRoomId] = useState(state?.roomId || '');
  const [boardSize, setBoardSize] = useState('s');

  function createGame() {
    // create-game
    navigate('/room/123456', {
      state: { username, count, boardSize },
    });
  }

  function joinGame() {
    // fetch game
    navigate('/room/123456', {
      state: { username, count, boardSize },
    });
  }

  function tabChange(index: number) {
    switch (index) {
      case 0:
        navigate('/');
        break;
      case 1:
        navigate('/create-game');
        break;
      default:
        navigate('/');
        break;
    }
  }

  return (
    <>
      <Card maxW="md" mt={4} ml={'auto'} mr={'auto'} boxShadow="md" borderRadius="md">
        <Tabs isFitted index={pathname === '/create-game' ? 1 : 0} onChange={tabChange}>
          <TabList>
            <Tab>Join Game</Tab>
            <Tab>Create Game</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Stack spacing={4}>
                <InputGroup>
                  <InputLeftAddon>Name</InputLeftAddon>
                  <Input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </InputGroup>
                <InputGroup>
                  <InputLeftAddon>Room</InputLeftAddon>
                  <Input type="text" placeholder="Room Id" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
                </InputGroup>
                <Button variant="solid" colorScheme="green" onClick={joinGame}>
                  Play Now
                </Button>
              </Stack>
            </TabPanel>
            <TabPanel>
              <Stack spacing={4}>
                <InputGroup>
                  <InputLeftAddon>Name</InputLeftAddon>
                  <Input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </InputGroup>
                <InputGroup>
                  <InputLeftAddon>Count</InputLeftAddon>
                  <Select
                    value={count}
                    onChange={(e) => setCount(+e.target.value)}
                    borderTopLeftRadius="0"
                    borderBottomLeftRadius="0"
                  >
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                  </Select>
                </InputGroup>
                <InputGroup>
                  <InputLeftAddon>Board Size</InputLeftAddon>
                  <Select
                    value={boardSize}
                    onChange={(e) => setBoardSize(e.target.value)}
                    borderTopLeftRadius="0"
                    borderBottomLeftRadius="0"
                  >
                    <option value="s">Small</option>
                    <option value="l">Large</option>
                  </Select>
                </InputGroup>
                <Button variant="solid" colorScheme="green" onClick={createGame}>
                  Create Game
                </Button>
              </Stack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Card>
    </>
  );
}

export default Home;
