// ---------------------------------------------------------------------------
// SOAP  ->  "used in some enterprise systems"
// XML envelopes + a WSDL contract. Verbose, strongly-typed, still common in
// banking / telecom / legacy enterprise integrations.
// ---------------------------------------------------------------------------

// The service implementation. Shape must match the WSDL: Service -> Port -> Op.
const service = {
  CalculatorService: {
    CalculatorPort: {
      Add: function (args) {
        return { result: parseInt(args.a, 10) + parseInt(args.b, 10) };
      },
    },
  },
};

// A minimal but valid document/literal WSDL for the Add operation.
const wsdl = `<?xml version="1.0" encoding="UTF-8"?>
<definitions name="Calculator"
    targetNamespace="http://example.com/calculator"
    xmlns:tns="http://example.com/calculator"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema"
    xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
    xmlns="http://schemas.xmlsoap.org/wsdl/">

  <types>
    <xsd:schema targetNamespace="http://example.com/calculator">
      <xsd:element name="AddRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="a" type="xsd:int"/>
            <xsd:element name="b" type="xsd:int"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      <xsd:element name="AddResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="result" type="xsd:int"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
    </xsd:schema>
  </types>

  <message name="AddInput">
    <part name="parameters" element="tns:AddRequest"/>
  </message>
  <message name="AddOutput">
    <part name="parameters" element="tns:AddResponse"/>
  </message>

  <portType name="CalculatorPortType">
    <operation name="Add">
      <input message="tns:AddInput"/>
      <output message="tns:AddOutput"/>
    </operation>
  </portType>

  <binding name="CalculatorBinding" type="tns:CalculatorPortType">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
    <operation name="Add">
      <soap:operation soapAction="http://example.com/calculator/Add"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
    </operation>
  </binding>

  <service name="CalculatorService">
    <port name="CalculatorPort" binding="tns:CalculatorBinding">
      <soap:address location="http://localhost/soap"/>
    </port>
  </service>
</definitions>`;

module.exports = { service, wsdl };
