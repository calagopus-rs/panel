import { NavLink, useLocation } from "react-router";
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tabs } from '@mantine/core';

interface Props {
  items: {
    name: string;
    icon: IconDefinition;
    link: string;
    end?: boolean;
  }[];
}

export default ({ items }: Props) => {
  const location = useLocation();
  const activeItem = items.find((item) => item.link === location.pathname);

  return (
    <Tabs my={'xs'} defaultValue={activeItem?.name ?? items[0].name}>
      <Tabs.List>
        {items.map((item) => (
          <NavLink key={item.name} to={item.link} end={item.end ?? true}>
            <Tabs.Tab key={item.name} value={item.name} leftSection={<FontAwesomeIcon icon={item.icon} />}>
              {item.name}
            </Tabs.Tab>
          </NavLink>
        ))}
      </Tabs.List>
    </Tabs>
  );
};
