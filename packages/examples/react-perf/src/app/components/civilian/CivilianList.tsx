import {Civilian} from "../../rules/rules";
import {Table, TableCell, TableRow, TableHead, TableContainer, TableBody, Button} from "@mui/material";

const CivilianList: React.FC<{civilians: Civilian[]}> = ({civilians}) => {

  return (
    <div>
      <TableContainer>
        <Table>
          <TableHead>
            <TableCell>First Name</TableCell>
            <TableCell>Last Name</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Job</TableCell>
          </TableHead>
          <TableBody>
            {civilians.map(({civilianFirstName, civilianLastName, civilianJob,civilianLocationId}) => (<TableRow>
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
