import {Civilian} from "../../rules/rules";
import {Table, TableCell, TableRow, TableHead, TableContainer, TableBody, Button} from "@mui/material";

export const CivilianList: React.FC<{civilians: (Civilian & {id: string})[]}> = ({civilians}) => {

  return (
    <div>
      <TableContainer>
        <Table>
          <TableHead>
            <TableCell>First Name</TableCell>
            <TableCell>Last Name</TableCell>
            <TableCell>Job</TableCell>
          </TableHead>
          <TableBody>
            {civilians.map(({id, civilianFirstName, civilianLastName, civilianJob,civilianLocationId}) => (
              <TableRow key={id}>
              <TableCell>{civilianFirstName}</TableCell>
              <TableCell>{civilianLastName}</TableCell>
              <TableCell>{civilianJob}</TableCell>
            </TableRow>))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  )
}
